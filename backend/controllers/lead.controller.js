const Lead = require("../models/lead.model");
const Property = require("../models/property.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

/**
 * CREATE LEAD (When buyer contacts owner/agent)
 * POST /api/leads/create
 * Body: { propertyId, buyerName, phone, source }
 */
exports.createLead = async (req, res) => {
  try {
    const { propertyId, buyerName, phone, source = "FORM" } = req.body;
    const buyerId = req.user?.id; // Optional: if user is logged in

    // Validate required fields
    if (!propertyId || !buyerName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Property ID, buyer name, and phone are required"
      });
    }

    // Get property details
    const property = await Property.findById(propertyId).populate("userId");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    if (property.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Cannot create lead for inactive property"
      });
    }

    // Check for duplicate lead (same phone + property in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingLead = await Lead.findOne({
      propertyId,
      phone,
      createdAt: { $gte: oneDayAgo }
    });

    if (existingLead) {
      return res.status(400).json({
        success: false,
        message: "You have already contacted for this property recently"
      });
    }

    // Create lead
    const lead = await Lead.create({
      propertyId,
      ownerId: property.userId._id,
      buyerId: buyerId || null,
      buyerName,
      phone,
      source,
      status: "NEW"
    });

    // Send notification to property owner
    try {
      await Notification.create({
        userId: property.userId._id,
        title: "New Lead Received! 🎉",
        message: `${buyerName} is interested in your property: ${property.location?.locality || 'Property'}`,
        type: "LEAD",
        data: {
          leadId: lead._id,
          propertyId: property._id,
          buyerName,
          phone
        }
      });

      console.log("✅ Notification sent to owner:", property.userId._id);
    } catch (notifError) {
      console.error("⚠️ Notification error:", notifError.message);
      // Don't fail the lead creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Lead created successfully! Owner will contact you soon.",
      data: lead
    });

  } catch (error) {
    console.error("❌ Create lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create lead",
      error: error.message
    });
  }
};

/**
 * GET MY LEADS (For Property Owners/Agents)
 * GET /api/leads/my-leads?status=NEW&propertyId=xxx
 * 
 * Plan-based Lead Access:
 * - Free Plan: 5 leads/month
 * - Basic Plan: 50 leads/month
 * - Premium Plan: Unlimited
 * - Locked leads shown if quota exhausted
 */
exports.getMyLeads = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { status, propertyId, page = 1, limit = 20 } = req.query;

    // Get user with active plan
    const owner = await User.findById(ownerId).populate('activePlan').lean();

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if quota needs reset (monthly)
    const now = new Date();
    const resetDate = owner.leadQuota?.resetDate;

    if (!resetDate || now > new Date(resetDate)) {
      // Reset quota for new month
      const nextResetDate = new Date(now);
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);

      const planLimit = owner.activePlan?.leadsPerMonth || 0;

      await User.findByIdAndUpdate(ownerId, {
        'leadQuota.consumed': 0,
        'leadQuota.limit': planLimit,
        'leadQuota.resetDate': nextResetDate
      });

      owner.leadQuota = {
        consumed: 0,
        limit: planLimit,
        resetDate: nextResetDate
      };
    }

    // Build filter
    const filter = { ownerId };

    if (status) {
      filter.status = status;
    }

    if (propertyId) {
      filter.propertyId = propertyId;
    }

    // Get leads with pagination
    const leads = await Lead.find(filter)
      .populate({
        path: "propertyId",
        select: "location images pricing listingType propertyCategory"
      })
      .populate({
        path: "buyerId",
        select: "name phone email profileImage"
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const totalLeads = await Lead.countDocuments(filter);

    // Determine which leads are accessible based on quota
    const quotaLimit = owner.leadQuota?.limit || 0;
    const quotaConsumed = owner.leadQuota?.consumed || 0;
    const isUnlimited = quotaLimit === 0; // Premium plan
    const remainingQuota = isUnlimited ? Infinity : Math.max(0, quotaLimit - quotaConsumed);

    // Process leads: unlock first N leads, lock the rest
    const processedLeads = leads.map((lead, index) => {
      const isAccessible = isUnlimited || index < remainingQuota;

      if (isAccessible) {
        // Unlocked lead - show full details
        return {
          ...lead,
          _isLocked: false
        };
      } else {
        // Locked lead - hide sensitive info
        return {
          _id: lead._id,
          propertyId: lead.propertyId,
          status: lead.status,
          source: lead.source,
          createdAt: lead.createdAt,
          buyerName: "●●●●●●", // Masked
          phone: "●●●●●●●●●●", // Masked
          _isLocked: true,
          _upgradeMessage: "Upgrade your plan to view this lead"
        };
      }
    });

    // Group by status for stats
    const mongoose = require('mongoose');
    const statusCounts = await Lead.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const stats = {
      total: totalLeads,
      new: statusCounts.find(s => s._id === "NEW")?.count || 0,
      contacted: statusCounts.find(s => s._id === "CONTACTED")?.count || 0,
      followUp: statusCounts.find(s => s._id === "FOLLOW_UP")?.count || 0,
      closed: statusCounts.find(s => s._id === "CLOSED")?.count || 0,
      lost: statusCounts.find(s => s._id === "LOST")?.count || 0
    };

    res.status(200).json({
      success: true,
      count: leads.length,
      total: totalLeads,
      page: parseInt(page),
      totalPages: Math.ceil(totalLeads / limit),
      stats,
      quota: {
        limit: quotaLimit,
        consumed: quotaConsumed,
        remaining: isUnlimited ? "Unlimited" : remainingQuota,
        resetDate: owner.leadQuota?.resetDate,
        planName: owner.activePlan?.planName || "Free"
      },
      data: processedLeads
    });

  } catch (error) {
    console.error("❌ Get my leads error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
      error: error.message
    });
  }
};

/**
 * UPDATE LEAD STATUS
 * PATCH /api/leads/:leadId/status
 * Body: { status: "CONTACTED" | "FOLLOW_UP" | "CLOSED" | "LOST" }
 */
exports.updateLeadStatus = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { status } = req.body;
    const ownerId = req.user.id;

    const validStatuses = ["NEW", "CONTACTED", "FOLLOW_UP", "CLOSED", "LOST"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    // Find lead and verify ownership
    const lead = await Lead.findOne({ _id: leadId, ownerId });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found or you don't have permission"
      });
    }

    lead.status = status;
    await lead.save();

    res.status(200).json({
      success: true,
      message: "Lead status updated successfully",
      data: lead
    });

  } catch (error) {
    console.error("❌ Update lead status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update lead status",
      error: error.message
    });
  }
};

/**
 * ADMIN: GET ALL LEADS
 * GET /api/admin/leads?status=NEW&page=1&limit=20
 */
exports.getAllLeads = async (req, res) => {
  try {
    const { status, propertyId, ownerId, page = 1, limit = 20, search } = req.query;

    // Build filter
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (propertyId) {
      filter.propertyId = propertyId;
    }

    if (ownerId) {
      filter.ownerId = ownerId;
    }

    if (search) {
      filter.$or = [
        { buyerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Get leads
    const leads = await Lead.find(filter)
      .populate({
        path: "propertyId",
        select: "location images pricing listingType propertyCategory status"
      })
      .populate({
        path: "ownerId",
        select: "name phone email userType"
      })
      .populate({
        path: "buyerId",
        select: "name phone email"
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const totalLeads = await Lead.countDocuments(filter);

    // Overall stats
    const stats = await Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const statusStats = {
      total: totalLeads,
      new: stats.find(s => s._id === "NEW")?.count || 0,
      contacted: stats.find(s => s._id === "CONTACTED")?.count || 0,
      followUp: stats.find(s => s._id === "FOLLOW_UP")?.count || 0,
      closed: stats.find(s => s._id === "CLOSED")?.count || 0,
      lost: stats.find(s => s._id === "LOST")?.count || 0
    };

    res.status(200).json({
      success: true,
      count: leads.length,
      total: totalLeads,
      page: parseInt(page),
      totalPages: Math.ceil(totalLeads / limit),
      stats: statusStats,
      data: leads
    });

  } catch (error) {
    console.error("❌ Get all leads error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
      error: error.message
    });
  }
};

/**
 * ADMIN: MARK LEAD AS SPAM
 * PATCH /api/admin/leads/:leadId/spam
 */
exports.markLeadAsSpam = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { isSpam } = req.body;

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { isSpam: isSpam !== false },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    res.status(200).json({
      success: true,
      message: `Lead marked as ${isSpam ? 'spam' : 'not spam'}`,
      data: lead
    });

  } catch (error) {
    console.error("❌ Mark spam error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update lead",
      error: error.message
    });
  }
};

/**
 * DELETE LEAD
 * DELETE /api/leads/:leadId
 */
exports.deleteLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const ownerId = req.user.id;

    const lead = await Lead.findOneAndDelete({ _id: leadId, ownerId });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found or you don't have permission"
      });
    }

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully"
    });

  } catch (error) {
    console.error("❌ Delete lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete lead",
      error: error.message
    });
  }
};

/**
 * UNLOCK LEAD (Consume quota to view lead details)
 * POST /api/leads/:leadId/unlock
 */
exports.unlockLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const ownerId = req.user.id;

    // Get user with plan
    const owner = await User.findById(ownerId).populate('activePlan');

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verify lead ownership
    const lead = await Lead.findOne({ _id: leadId, ownerId })
      .populate('propertyId')
      .populate('buyerId');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found or you don't have permission"
      });
    }

    // Check quota
    const quotaLimit = owner.leadQuota?.limit || 0;
    const quotaConsumed = owner.leadQuota?.consumed || 0;
    const isUnlimited = quotaLimit === 0;

    if (!isUnlimited && quotaConsumed >= quotaLimit) {
      return res.status(403).json({
        success: false,
        message: "Lead quota exhausted. Please upgrade your plan.",
        quota: {
          limit: quotaLimit,
          consumed: quotaConsumed,
          remaining: 0,
          planName: owner.activePlan?.planName || "Free"
        }
      });
    }

    // Increment consumed quota
    if (!isUnlimited) {
      await User.findByIdAndUpdate(ownerId, {
        $inc: { 'leadQuota.consumed': 1 }
      });
    }

    res.status(200).json({
      success: true,
      message: "Lead unlocked successfully",
      data: {
        ...lead.toObject(),
        _isLocked: false
      },
      quota: {
        consumed: quotaConsumed + 1,
        remaining: isUnlimited ? "Unlimited" : quotaLimit - quotaConsumed - 1
      }
    });

  } catch (error) {
    console.error("❌ Unlock lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unlock lead",
      error: error.message
    });
  }
};
