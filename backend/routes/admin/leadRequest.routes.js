const express = require("express");
const router = express.Router();
const isAuth = require("../../middleware/auth.middleware");
const isAdmin = require("../../middleware/admin.middleware");
const {
    getAllLeadRequests,
    approveAndSendLeads,
    rejectLeadRequest
} = require("../../controllers/leadRequest.controller");

// ✅ Get All Lead Requests (Admin)
router.get("/", isAuth, isAdmin, getAllLeadRequests);

// ✅ Approve & Send Leads
router.post("/:requestId/approve", isAuth, isAdmin, approveAndSendLeads);

// ✅ Reject Lead Request
router.post("/:requestId/reject", isAuth, isAdmin, rejectLeadRequest);

module.exports = router;
