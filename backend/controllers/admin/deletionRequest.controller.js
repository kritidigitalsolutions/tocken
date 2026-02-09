const User = require("../../models/user.model");

/**
 * GET ALL DELETION REQUESTS
 * GET /api/admin/deletion-requests
 */
exports.getDeletionRequests = async (req, res) => {
    try {
        const { status = "PENDING", page = 1, limit = 20 } = req.query;

        const query = {};

        if (status !== "ALL") {
            query["deletionRequest.status"] = status;
        } else {
            query["deletionRequest.status"] = { $in: ["PENDING", "APPROVED", "REJECTED"] };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [requests, total] = await Promise.all([
            User.find(query)
                .select("name phone userType profileImage deletionRequest createdAt")
                .sort({ "deletionRequest.requestedAt": -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(query)
        ]);

        // Count by status
        const pendingCount = await User.countDocuments({ "deletionRequest.status": "PENDING" });
        const approvedCount = await User.countDocuments({ "deletionRequest.status": "APPROVED" });
        const rejectedCount = await User.countDocuments({ "deletionRequest.status": "REJECTED" });

        res.status(200).json({
            success: true,
            requests,
            stats: {
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
                total: pendingCount + approvedCount + rejectedCount
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRequests: total,
                hasMore: (parseInt(page) * parseInt(limit)) < total
            }
        });

    } catch (error) {
        console.error("Get deletion requests error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch deletion requests",
            error: error.message
        });
    }
};

/**
 * APPROVE DELETION REQUEST (Permanently delete user)
 * POST /api/admin/deletion-requests/:userId/approve
 */
exports.approveDeletion = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.deletionRequest?.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "No pending deletion request for this user"
            });
        }

        // Store user info before deletion for logging
        const userInfo = {
            name: user.name,
            phone: user.phone,
            reason: user.deletionRequest.reason,
            feedback: user.deletionRequest.feedback
        };

        // Option 1: Soft delete (mark as approved but keep data)
        user.deletionRequest.status = "APPROVED";
        user.deletionRequest.processedAt = new Date();
        user.deletionRequest.processedBy = req.user.id;
        user.isBlocked = true; // Block the account
        await user.save();

        // Option 2: Hard delete (uncomment to permanently delete)
        // await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: "Account deletion approved. User account has been deactivated.",
            userInfo
        });

    } catch (error) {
        console.error("Approve deletion error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to approve deletion",
            error: error.message
        });
    }
};

/**
 * REJECT DELETION REQUEST
 * POST /api/admin/deletion-requests/:userId/reject
 */
// exports.rejectDeletion = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { adminNote } = req.body;

//         const user = await User.findById(userId);

//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         if (user.deletionRequest?.status !== "PENDING") {
//             return res.status(400).json({
//                 success: false,
//                 message: "No pending deletion request for this user"
//             });
//         }

//         user.deletionRequest.status = "REJECTED";
//         user.deletionRequest.processedAt = new Date();
//         user.deletionRequest.processedBy = req.user.id;

//         await user.save();

//         res.status(200).json({
//             success: true,
//             message: "Deletion request rejected",
//             user: {
//                 name: user.name,
//                 phone: user.phone
//             }
//         });

//     } catch (error) {
//         console.error("Reject deletion error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to reject deletion",
//             error: error.message
//         });
//     }
// };

/**
 * PERMANENTLY DELETE USER (Hard delete)
 * DELETE /api/admin/deletion-requests/:userId/permanent
 */
exports.permanentlyDeleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Store info for response
        const userInfo = {
            name: user.name,
            phone: user.phone
        };

        // Permanently delete the user
        await User.findByIdAndDelete(userId);

        // TODO: Also delete user's properties, leads, etc.

        res.status(200).json({
            success: true,
            message: "User permanently deleted",
            userInfo
        });

    } catch (error) {
        console.error("Permanent delete error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to permanently delete user",
            error: error.message
        });
    }
};
