const Lead = require("../../models/lead.model");
const User = require("../../models/user.model");
const Property = require("../../models/property.model");
const Notification = require("../../models/notification.model");
const { sendPushNotification } = require("../../utils/fcm.service");

/**
 * 🔹 D. ADMIN → ASSIGN ACTUAL LEAD
 * POST /api/admin/leads/assign
 * Body: { assignedTo, buyerName, phone, city, requirement, leadType, propertyId? }
 */
exports.assignLead = async (req, res) => {
    try {
        const { 
            assignedTo, 
            buyerName, 
            phone, 
            city, 
            requirement, 
            leadType,
            propertyId 
        } = req.body;

        // 🔹 Validation
        if (!assignedTo || !buyerName || !phone || !city || !requirement || !leadType) {
            return res.status(400).json({
                success: false,
                message: "assignedTo, buyerName, phone, city, requirement, and leadType are required"
            });
        }

        if (!["BUYER", "RENTER"].includes(leadType)) {
            return res.status(400).json({
                success: false,
                message: "leadType must be BUYER or RENTER"
            });
        }

        // 🔹 Get user details
        const user = await User.findById(assignedTo).populate('activePlan');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 🔹 Check user plan and quota
        if (!user.activePlan) {
            return res.status(400).json({
                success: false,
                message: "User has no active plan"
            });
        }

        const planLimit = user.activePlan.leadsPerMonth || 0;
        const quotaConsumed = user.leadQuota?.consumed || 0;
        const isUnlimited = planLimit === 0;

        if (!isUnlimited && quotaConsumed >= planLimit) {
            return res.status(400).json({
                success: false,
                message: "User has exhausted their lead quota"
            });
        }

        // 🔹 Validate property reference (optional)
        if (propertyId) {
            const property = await Property.findById(propertyId);
            if (!property) {
                return res.status(404).json({
                    success: false,
                    message: "Property reference not found"
                });
            }
        }

        // 🔹 Create lead entry
        const lead = await Lead.create({
            assignedTo,
            leadType,
            buyerName,
            phone,
            city,
            requirement,
            propertyId: propertyId || null,
            status: "NEW",
            source: "ADMIN"
        });

        // 🔹 Update user's quota
        if (!isUnlimited) {
            await User.findByIdAndUpdate(assignedTo, {
                $inc: { 'leadQuota.consumed': 1 }
            });
        }

        // 🔹 Create and send notification to the user
        try {
            const notificationTitle = "New Lead Assigned!";
            const notificationMessage = `You have been assigned a new ${leadType.toLowerCase()} lead: ${buyerName} from ${city}`;
            
            // Create notification in database
            const notification = await Notification.create({
                title: notificationTitle,
                message: notificationMessage,
                type: "LEAD",
                targetUser: assignedTo,
                metadata: {
                    leadId: lead._id,
                    actionUrl: "/dashboard/leads"
                },
                sentAt: new Date()
            });

            // Send push notification if user has FCM token
            if (user.fcmToken) {
                await sendPushNotification({
                    token: user.fcmToken,
                    title: notificationTitle,
                    body: notificationMessage,
                    data: {
                        type: "LEAD",
                        leadId: lead._id.toString(),
                        actionUrl: "/dashboard/leads"
                    }
                });
                console.log(`✅ Lead assignment notification sent to ${user.name}`);
            } else {
                console.log(`⚠️  User ${user.name} has no FCM token for notification`);
            }
        } catch (notificationError) {
            console.error("❌ Failed to send lead assignment notification:", notificationError);
            // Don't fail the request if notification fails - it's not critical
        }

        // 🔹 Populate response data
        const populatedLead = await Lead.findById(lead._id)
            .populate({
                path: "assignedTo",
                select: "name phone email userType"
            })
            .populate({
                path: "propertyId",
                select: "title location propertyCategory"
            });

        res.status(201).json({
            success: true,
            message: "Lead assigned successfully",
            data: {
                _id: populatedLead._id,
                assignedTo: populatedLead.assignedTo,
                leadType: populatedLead.leadType,
                buyerName: populatedLead.buyerName,
                phone: populatedLead.phone,
                city: populatedLead.city,
                requirement: populatedLead.requirement,
                property: populatedLead.propertyId,
                status: populatedLead.status,
                createdAt: populatedLead.createdAt
            },
            userQuota: {
                consumed: quotaConsumed + (isUnlimited ? 0 : 1),
                limit: planLimit,
                remaining: isUnlimited ? "Unlimited" : (planLimit - quotaConsumed - 1)
            }
        });

    } catch (error) {
        console.error("❌ Assign lead error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to assign lead",
            error: error.message
        });
    }
};

/**
 * 🔹 ADMIN → VIEW ALL LEADS
 * GET /api/admin/leads
 * Query: ?status=NEW&assignedTo=userId&page=1&limit=20
 */
exports.getAllLeads = async (req, res) => {
    try {
        const { status, assignedTo, page = 1, limit = 20 } = req.query;

        // 🔹 Build filter
        const filter = {};
        if (status) filter.status = status;
        if (assignedTo) filter.assignedTo = assignedTo;

        // 🔹 Get leads
        const leads = await Lead.find(filter)
            .populate({
                path: "assignedTo",
                select: "name phone email userType"
            })
            .populate({
                path: "propertyId",
                select: "title location propertyCategory pricing"
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Lead.countDocuments(filter);

        // 🔹 Get stats
        const stats = await Lead.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const statusStats = {
            total,
            new: stats.find(s => s._id === "NEW")?.count || 0,
            contacted: stats.find(s => s._id === "CONTACTED")?.count || 0,
            closed: stats.find(s => s._id === "CLOSED")?.count || 0
        };

        res.status(200).json({
            success: true,
            data: leads,
            stats: statusStats,
            pagination: {
                current: parseInt(page),
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total
            }
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
 * 🔹 ADMIN → VIEW USER QUOTA
 * GET /api/admin/users/:userId/quota
 */
exports.getUserQuota = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).populate('activePlan');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const planLimit = user.activePlan?.leadsPerMonth || 0;
        const quotaConsumed = user.leadQuota?.consumed || 0;
        const isUnlimited = planLimit === 0;

        res.status(200).json({
            success: true,
            data: {
                userId: user._id,
                userName: user.name,
                userType: user.userType,
                plan: user.activePlan ? {
                    name: user.activePlan.planName,
                    leadsPerMonth: user.activePlan.leadsPerMonth
                } : null,
                quota: {
                    consumed: quotaConsumed,
                    limit: planLimit,
                    remaining: isUnlimited ? "Unlimited" : Math.max(0, planLimit - quotaConsumed),
                    resetDate: user.leadQuota?.resetDate
                }
            }
        });

    } catch (error) {
        console.error("❌ Get user quota error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user quota",
            error: error.message
        });
    }
};