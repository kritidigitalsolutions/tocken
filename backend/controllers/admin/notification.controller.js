const Notification = require("../../models/notification.model");
const User = require("../../models/user.model");
const { sendPushNotification } = require("../../utils/fcm.service");

/**
 * Create a new notification (Admin)
 * POST /api/admin/notifications
 */
const createNotification = async (req, res) => {
    try {
        const { title, message, type, targetUserId, targetUserType, metadata } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: "Title and message are required"
            });
        }

        const notificationData = {
            title,
            message,
            type: type || "GENERAL",
            createdBy: req.user.id
        };

        let targetUser = null;

        // If specific user is targeted
        if (targetUserId) {
            targetUser = await User.findById(targetUserId);
            if (!targetUser) {
                return res.status(404).json({
                    success: false,
                    message: "Target user not found"
                });
            }
            notificationData.targetUser = targetUserId;
            notificationData.targetUserType = null;
        } else {
            // Broadcast to all or specific user type
            notificationData.targetUserType = targetUserType || "ALL";
        }

        // Add optional metadata
        if (metadata) {
            notificationData.metadata = metadata;
        }

        const notification = await Notification.create(notificationData);

        // Populate createdBy for response
        await notification.populate("createdBy", "name email");

        // 🔔 SEND PUSH NOTIFICATION
        let deliveryStatus = 'SENT';
        let fcmError = null;

        if (targetUserId) {
            // Single user
            if (targetUser && targetUser.fcmToken) {
                const result = await sendPushNotification({
                    token: targetUser.fcmToken,
                    title,
                    body: message,
                    data: {
                        notificationId: notification._id.toString(),
                        type: type || "GENERAL"
                    }
                });
                
                if (result.status === 'FAILED') {
                    deliveryStatus = 'FAILED';
                    fcmError = result.error;
                }
            } else {
                deliveryStatus = 'PENDING';
            }
        } else {
            // Broadcast / User type
            const users = await User.find({
                fcmToken: { $ne: null },
                ...(targetUserType && targetUserType !== "ALL"
                    ? { userType: targetUserType }
                    : {})
            });

            let failedCount = 0;
            for (const u of users) {
                const result = await sendPushNotification({
                    token: u.fcmToken,
                    title,
                    body: message,
                    data: {
                        notificationId: notification._id.toString(),
                        type: type || "GENERAL"
                    }
                });
                
                if (result.status === 'FAILED') {
                    failedCount++;
                }
            }

            // If any FCM sends failed, mark as FAILED
            if (failedCount > 0) {
                deliveryStatus = 'FAILED';
                fcmError = `Failed to deliver to ${failedCount} users`;
            }
        }

        // Update notification with delivery status
        notification.deliveryStatus = deliveryStatus;
        notification.sentAt = new Date();
        if (fcmError) {
            notification.fcmResponse = fcmError;
        }
        await notification.save();

        res.status(201).json({
            success: true,
            message: "Notification created successfully",
            notification
        });
    } catch (error) {
        console.error("Create notification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create notification",
            error: error.message
        });
    }
};


/**
 * Get all notifications (Admin)
 * GET /api/admin/notifications
 */
const getAllNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, targetUserType } = req.query;

        const query = {};

        if (type) {
            query.type = type;
        }

        if (targetUserType) {
            query.targetUserType = targetUserType;
        }

        const notifications = await Notification.find(query)
            .populate("createdBy", "name email")
            .populate("targetUser", "name phone")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);

        res.status(200).json({
            success: true,
            notifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalNotifications: total,
                hasMore: page * limit < total
            }
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
};

/**
 * Get single notification (Admin)
 * GET /api/admin/notifications/:id
 */
const getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id)
            .populate("createdBy", "name email")
            .populate("targetUser", "name phone")
            .populate("readBy.user", "name phone");

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            notification
        });
    } catch (error) {
        console.error("Get notification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch notification",
            error: error.message
        });
    }
};

/**
 * Update notification (Admin)
 * PUT /api/admin/notifications/:id
 */
const updateNotification = async (req, res) => {
    try {
        const { title, message, type, isActive } = req.body;

        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        if (title) notification.title = title;
        if (message) notification.message = message;
        if (type) notification.type = type;
        if (typeof isActive === "boolean") notification.isActive = isActive;

        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification updated successfully",
            notification
        });
    } catch (error) {
        console.error("Update notification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update notification",
            error: error.message
        });
    }
};

/**
 * Delete notification (Admin)
 * DELETE /api/admin/notifications/:id
 */
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete notification",
            error: error.message
        });
    }
};

/**
 * Get notification statistics (Admin)
 * GET /api/admin/notifications/stats
 */
const getNotificationStats = async (req, res) => {
    try {
        const totalNotifications = await Notification.countDocuments();
        const activeNotifications = await Notification.countDocuments({ isActive: true });

        // Count by type
        const byType = await Notification.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);

        // Count by target user type
        const byTargetType = await Notification.aggregate([
            { $match: { targetUser: null } },
            { $group: { _id: "$targetUserType", count: { $sum: 1 } } }
        ]);

        // Recent notifications (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentCount = await Notification.countDocuments({
            createdAt: { $gte: weekAgo }
        });

        res.status(200).json({
            success: true,
            stats: {
                total: totalNotifications,
                active: activeNotifications,
                inactive: totalNotifications - activeNotifications,
                recentWeek: recentCount,
                byType: byType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byTargetType: byTargetType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error("Get notification stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch notification stats",
            error: error.message
        });
    }
};

module.exports = {
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
    getNotificationStats
};
