const LeadRequest = require("../../models/leadRequest.model");
const Lead = require("../../models/lead.model");
const User = require("../../models/user.model");
const Property = require("../../models/property.model");

/**
 * 🔹 B. ADMIN → VIEW LEAD REQUESTS
 * GET /api/admin/lead-requests
 * Query: ?status=PENDING&page=1&limit=20
 */
exports.getAllLeadRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        // 🔹 Build filter
        const filter = {};
        if (status) {
            filter.status = status;
        }

        // 🔹 Get requests with user details
        const requests = await LeadRequest.find(filter)
            .populate({
                path: "requestedBy",
                select: "name phone email userType activePlan leadQuota planSubscription"
            })
            .populate({
                path: "requestedBy",
                populate: {
                    path: "activePlan",
                    select: "planName leadsPerMonth price validityDays"
                }
            })
            .populate({
                path: "approvedBy",
                select: "name email"
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await LeadRequest.countDocuments(filter);

        // 🔹 Get stats
        const stats = await LeadRequest.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const statusStats = {
            pending: stats.find(s => s._id === "PENDING")?.count || 0,
            approved: stats.find(s => s._id === "APPROVED")?.count || 0,
            rejected: stats.find(s => s._id === "REJECTED")?.count || 0
        };

        res.status(200).json({
            success: true,
            data: requests,
            stats: statusStats,
            pagination: {
                current: parseInt(page),
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total
            }
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
 * 🔹 C. ADMIN → PLAN VALIDATION & APPROVE REQUEST
 * POST /api/admin/lead-requests/:requestId/approve
 * Body: { adminNotes? }
 */
exports.approveLeadRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.user.id;
        const { adminNotes } = req.body;

        // 🔹 Get lead request
        const leadRequest = await LeadRequest.findById(requestId).populate({
            path: "requestedBy",
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

        // 🔹 Plan validation logic
        const user = leadRequest.requestedBy;

        if (!user.activePlan) {
            return res.status(400).json({
                success: false,
                message: "User has no active plan. Request cannot be approved."
            });
        }

        // 🔹 Enhanced plan subscription validation
        const subscription = user.planSubscription;
        if (!subscription || !subscription.isActive) {
            return res.status(400).json({
                success: false,
                message: "User plan subscription is not active. Request cannot be approved."
            });
        }

        // Check if subscription is expired
        const now = new Date();
        if (subscription.endDate && now > new Date(subscription.endDate)) {
            // Auto-deactivate expired subscription
            await User.findByIdAndUpdate(user._id, {
                'planSubscription.isActive': false,
                'leadQuota.limit': 0
            });
            
            return res.status(400).json({
                success: false,
                message: "User plan has expired. Request cannot be approved."
            });
        }

        // 🔹 Check monthly quota
        const planLimit = user.activePlan.leadsPerMonth || 0;
        const quotaConsumed = user.leadQuota?.consumed || 0;

        // Reset quota if needed (monthly reset)
        const resetDate = user.leadQuota?.resetDate;

        if (!resetDate || now > new Date(resetDate)) {
            // Reset quota for new month
            const nextResetDate = new Date(now);
            nextResetDate.setMonth(nextResetDate.getMonth() + 1);
            nextResetDate.setDate(1); // First day of next month

            await User.findByIdAndUpdate(user._id, {
                'leadQuota.consumed': 0,
                'leadQuota.limit': planLimit,
                'leadQuota.resetDate': nextResetDate
            });
            
            user.leadQuota = { consumed: 0, limit: planLimit, resetDate: nextResetDate };
        }

        const isUnlimited = planLimit === 0;
        if (!isUnlimited && user.leadQuota.consumed >= planLimit) {
            return res.status(400).json({
                success: false,
                message: "User has exhausted their monthly lead quota. Cannot approve request."
            });
        }

        // 🔹 Approve request
        leadRequest.status = "APPROVED";
        leadRequest.approvedBy = adminId;
        leadRequest.approvedAt = new Date();
        leadRequest.adminNotes = adminNotes;
        await leadRequest.save();

        res.status(200).json({
            success: true,
            message: "Lead request approved successfully. You can now assign leads to this user.",
            data: {
                _id: leadRequest._id,
                status: leadRequest.status,
                approvedAt: leadRequest.approvedAt,
                userQuota: {
                    consumed: user.leadQuota.consumed,
                    limit: user.leadQuota.limit,
                    remaining: isUnlimited ? "Unlimited" : (user.leadQuota.limit - user.leadQuota.consumed)
                }
            }
        });

    } catch (error) {
        console.error("❌ Approve lead request error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to approve lead request",
            error: error.message
        });
    }
};

/**
 * 🔹 ADMIN → REJECT LEAD REQUEST
 * POST /api/admin/lead-requests/:requestId/reject
 * Body: { rejectionReason }
 */
exports.rejectLeadRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required"
            });
        }

        const leadRequest = await LeadRequest.findById(requestId);

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

        // 🔹 Reject request
        leadRequest.status = "REJECTED";
        leadRequest.rejectionReason = rejectionReason;
        await leadRequest.save();

        res.status(200).json({
            success: true,
            message: "Lead request rejected successfully",
            data: {
                _id: leadRequest._id,
                status: leadRequest.status,
                rejectionReason: leadRequest.rejectionReason
            }
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