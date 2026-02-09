const express = require("express");
const router = express.Router();

const {
    getDeletionRequests,
    approveDeletion,
    // rejectDeletion,
    permanentlyDeleteUser
} = require("../../controllers/admin/deletionRequest.controller");

// GET all deletion requests
router.get("/", getDeletionRequests);

// Approve deletion request (soft delete - deactivate account)
router.post("/:userId/approve", approveDeletion);

// Reject deletion request
// router.post("/:userId/reject", rejectDeletion);

// Permanently delete user (hard delete)
router.delete("/:userId/permanent", permanentlyDeleteUser);

module.exports = router;
