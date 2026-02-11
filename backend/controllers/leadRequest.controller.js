const LeadRequest = require("../models/leadRequest.model");
const User = require("../models/user.model");
const Property = require("../models/property.model");
const Lead = require("../models/lead.model");
const Notification = require("../models/notification.model");

/**
 * CREATE LEAD REQUEST (Agent/Builder/Owner)
 * POST /api/lead-requests/create
 */
exports.createLeadRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { leadType, dealingCities, propertyTypes, budgetRange, requestNotes } = req.body;

        // Validation
        if (!leadType || !dealingCities || !propertyTypes) {
            return res.status(400).json({
                success: false,
                message: "Lead type, cities, and property types are required"
            });
        }

        if (!Array.isArray(dealingCities) || dealingCities.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one city is required"
            });
        }

        if (!Array.isArray(propertyTypes) || propertyTypes.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one property type is required"
            });
        }

        // Check if user already has pending request
        const existingRequest = await LeadRequest.findOne({
            userId,
            status: "PENDING"
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending lead request. Please wait for admin approval."
            });
        }

        // Create lead request
        const leadRequest = await LeadRequest.create({
            userId,
            leadType,
            dealingCities,
            propertyTypes,
            budgetRange,
            requestNotes,
            status: "PENDING"
        });

        // Notify admin (you can get admin IDs from Admin model)
        // For now, we'll just log it
        console.log("✅ New lead request created:", leadRequest._id);

        res.status(201).json({
            success: true,
            message: "Lead request submitted successfully. Admin will review it soon.",
            data: leadRequest
        });

    } catch (error) {
        console.error("❌ Create lead request error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create lead request",
            error: error.message
        });
    }
};

/**
 * GET MY LEAD REQUESTS (User)
 * GET /api/lead-requests/my-requests
 */
exports.getMyLeadRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        const filter = { userId };
        if (status) {
            filter.status = status;
        }

        const requests = await LeadRequest.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error("❌ Get my lead requests error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch lead requests",
            error: error.message
        });
    }
};

/**
 * ADMIN: GET ALL LEAD REQUESTS
 * GET /api/admin/lead-requests?status=PENDING
 */
exports.getAllLeadRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) {
            filter.status = status;
        }

        const requests = await LeadRequest.find(filter)
            .populate({
                path: "userId",
                select: "name phone email userType activePlan leadQuota"
            })
            .populate("activePlan")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await LeadRequest.countDocuments(filter);

        // Get stats
        const stats = await LeadRequest.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const statusStats = {
            pending: stats.find(s => s._id === "PENDING")?.count || 0,
            approved: stats.find(s => s._id === "APPROVED")?.count || 0,
            rejected: stats.find(s => s._id === "REJECTED")?.count || 0,
            fulfilled: stats.find(s => s._id === "FULFILLED")?.count || 0
        };

        res.status(200).json({
            success: true,
            count: requests.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            stats: statusStats,
            data: requests
        });

    } catch (error) {
        console.error("❌ Get all lead requests error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch lead requests",
            error: error.message
        });
    }
};

/**
 * ADMIN: APPROVE & SEND LEADS
 * POST /api/admin/lead-requests/:requestId/approve
 */
exports.approveAndSendLeads = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.user.id;
        const { numberOfLeads, adminNotes } = req.body;

        // Get lead request
        const leadRequest = await LeadRequest.findById(requestId).populate({
            path: "userId",
            populate: { path: "activePlan" }
        });

        if (!leadRequest) {
            return res.status(404).json({
                success: false,
                message: "Lead request not found"
            });
        }

        if (leadRequest.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: `Request is already ${leadRequest.status.toLowerCase()}`
            });
        }

        // Check user's plan and quota
        const user = leadRequest.userId;
        const planLimit = user.activePlan?.leadsPerMonth || 0;
        const quotaConsumed = user.leadQuota?.consumed || 0;
        const isUnlimited = planLimit === 0;
        const availableQuota = isUnlimited ? Infinity : Math.max(0, planLimit - quotaConsumed);

        const leadsToSend = numberOfLeads || Math.min(10, availableQuota);

        if (!isUnlimited && availableQuota === 0) {
            return res.status(400).json({
                success: false,
                message: "User has exhausted their lead quota. Cannot send leads."
            });
        }

        // Find matching properties based on request criteria
        const propertyFilter = {
            status: "ACTIVE",
            isDeleted: false,
            "location.city": { $in: leadRequest.dealingCities }
        };

        // Add property type filter if specified
        if (leadRequest.propertyTypes && leadRequest.propertyTypes.length > 0) {
            propertyFilter.propertyCategory = { $in: leadRequest.propertyTypes };
        }

        // Find properties
        const matchingProperties = await Property.find(propertyFilter)
            .limit(parseInt(leadsToSend))
            .lean();

        if (matchingProperties.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No matching properties found for the specified criteria"
            });
        }

        // Create leads for each property
        const createdLeads = [];
        for (const property of matchingProperties) {
            // Create a lead entry
            const lead = await Lead.create({
                propertyId: property._id,
                ownerId: property.userId,
                buyerId: user._id,
                buyerName: user.name || `${user.firstName} ${user.lastName}`,
                phone: user.phone,
                source: "ADMIN_ASSIGNED",
                status: "NEW"
            });

            createdLeads.push(lead._id);
        }

        // Update lead request
        leadRequest.status = "FULFILLED";
        leadRequest.approvedBy = adminId;
        leadRequest.approvedAt = new Date();
        leadRequest.leadsAssigned = createdLeads.length;
        leadRequest.assignedLeadIds = createdLeads;
        leadRequest.adminNotes = adminNotes;
        await leadRequest.save();

        // Update user's quota
        if (!isUnlimited) {
            await User.findByIdAndUpdate(user._id, {
                $inc: { "leadQuota.consumed": createdLeads.length }
            });
        }

        // Send notification to user
        await Notification.create({
            userId: user._id,
            title: "Leads Assigned! 🎉",
            message: `${createdLeads.length} leads have been assigned to you based on your request.`,
            type: "LEAD_REQUEST_APPROVED",
            data: {
                requestId: leadRequest._id,
                leadsCount: createdLeads.length
            }
        });

        res.status(200).json({
            success: true,
            message: `Successfully sent ${createdLeads.length} leads to user`,
            data: {
                requestId: leadRequest._id,
                leadsAssigned: createdLeads.length,
                leadIds: createdLeads
            }
        });

    } catch (error) {
        console.error("❌ Approve and send leads error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to approve and send leads",
            error: error.message
        });
    }
};

/**
 * ADMIN: REJECT LEAD REQUEST
 * POST /api/admin/lead-requests/:requestId/reject
 */
exports.rejectLeadRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { rejectionReason } = req.body;

        const leadRequest = await LeadRequest.findById(requestId);

        if (!leadRequest) {
            return res.status(404).json({
                success: false,
                message: "Lead request not found"
            });
        }

        leadRequest.status = "REJECTED";
        leadRequest.rejectionReason = rejectionReason;
        await leadRequest.save();

        // Notify user
        await Notification.create({
            userId: leadRequest.userId,
            title: "Lead Request Rejected",
            message: rejectionReason || "Your lead request has been rejected by admin.",
            type: "LEAD_REQUEST_REJECTED"
        });

        res.status(200).json({
            success: true,
            message: "Lead request rejected successfully"
        });

    } catch (error) {
        console.error("❌ Reject lead request error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reject lead request",
            error: error.message
        });
    }
};
