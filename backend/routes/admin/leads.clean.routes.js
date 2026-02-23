const express = require("express");
const router = express.Router();
const isAuth = require("../../middleware/auth.middleware");
const isAdmin = require("../../middleware/admin.middleware");

// Import clean admin controllers
const {
    getAllLeadRequests,
    approveLeadRequest,
    rejectLeadRequest
} = require("../../controllers/admin/leadRequest.clean.controller");

const {
    assignLead,
    assignLeadBulk,
    getSubscriptionUsersCount,
    getAllLeads,
    getUserQuota
} = require("../../controllers/admin/lead.clean.controller");

// 🔹 B. ADMIN → VIEW LEAD REQUESTS
router.get("/requests", isAuth, isAdmin, getAllLeadRequests);

// 🔹 C. ADMIN → APPROVE LEAD REQUEST
router.post("/requests/:requestId/approve", isAuth, isAdmin, approveLeadRequest);

// 🔹 ADMIN → REJECT LEAD REQUEST
router.post("/requests/:requestId/reject", isAuth, isAdmin, rejectLeadRequest);

// 🔹 D. ADMIN → ASSIGN ACTUAL LEAD
router.post("/assign", isAuth, isAdmin, assignLead);

// 🔹 ADMIN → ASSIGN LEAD TO ALL SUBSCRIPTION USERS (BULK)
router.post("/assign-bulk", isAuth, isAdmin, assignLeadBulk);

// 🔹 ADMIN → GET SUBSCRIPTION USERS COUNT
router.get("/subscription-users-count", isAuth, isAdmin, getSubscriptionUsersCount);

// 🔹 ADMIN → VIEW ALL LEADS
router.get("/", isAuth, isAdmin, getAllLeads);

// 🔹 ADMIN → VIEW USER QUOTA
router.get("/users/:userId/quota", isAuth, isAdmin, getUserQuota);

module.exports = router;