const Lead = require("../models/lead.model");
const User = require("../models/user.model");
const Property = require("../models/property.model");
const mongoose = require("mongoose");

/**
 * 🔹 E. USER → MY LEADS
 * GET /api/leads/my
 * Response: Clean lead data with property reference only
 */
exports.getMyLeads = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 20 } = req.query;

        // 🔹 Build filter
        const filter = { assignedTo: userId };

        if (status) {
            filter.status = status;
        }

        // 🔹 Get leads with pagination
        const leads = await Lead.find(filter)
            .populate({
                path: "propertyId",
                select: "title location pricing images propertyCategory listingType"
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const totalLeads = await Lead.countDocuments(filter);

        // 🔹 Format response data
        const formattedLeads = leads.map(lead => ({
            _id: lead._id,
            buyerName: lead.buyerName,
            phone: lead.phone,
            city: lead.city,
            requirement: lead.requirement,
            leadType: lead.leadType,
            status: lead.status,
            source: lead.source,
            createdAt: lead.createdAt,
            // Property is just a reference
            property: lead.propertyId ? {
                _id: lead.propertyId._id,
                title: lead.propertyId.title,
                location: lead.propertyId.location,
                propertyCategory: lead.propertyId.propertyCategory,
                pricing: lead.propertyId.pricing
            } : null
        }));

        res.status(200).json({
            success: true,
            data: formattedLeads,
            pagination: {
                current: parseInt(page),
                totalPages: Math.ceil(totalLeads / limit),
                totalLeads,
                hasNext: page * limit < totalLeads
            }
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
 * 🔹 F. USER → UPDATE LEAD STATUS
 * PATCH /api/leads/:id
 * Body: { status: "CONTACTED" | "CLOSED" }
 */
exports.updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { status } = req.body;

        // 🔹 Validate status
        if (!["NEW", "CONTACTED", "CLOSED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Allowed: NEW, CONTACTED, CLOSED"
            });
        }

        // 🔹 Find and update lead (only if assigned to this user)
        const lead = await Lead.findOneAndUpdate(
            { _id: id, assignedTo: userId },
            { status },
            { new: true }
        ).populate({
            path: "propertyId",
            select: "title location"
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found or you don't have permission to update it"
            });
        }

        res.status(200).json({
            success: true,
            message: "Lead status updated successfully",
            data: {
                _id: lead._id,
                status: lead.status,
                updatedAt: lead.updatedAt
            }
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
 * 🔹 USER → GET LEAD STATS
 * GET /api/leads/stats
 */
exports.getLeadStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 🔹 Get stats for this user
        const stats = await Lead.aggregate([
            { $match: { assignedTo: mongoose.Types.ObjectId(userId) } },
            { 
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await Lead.countDocuments({ assignedTo: userId });

        // 🔹 Format stats
        const formattedStats = {
            total,
            new: stats.find(s => s._id === "NEW")?.count || 0,
            contacted: stats.find(s => s._id === "CONTACTED")?.count || 0,
            closed: stats.find(s => s._id === "CLOSED")?.count || 0
        };

        res.status(200).json({
            success: true,
            data: formattedStats
        });

    } catch (error) {
        console.error("❌ Get lead stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch lead statistics",
            error: error.message
        });
    }
};