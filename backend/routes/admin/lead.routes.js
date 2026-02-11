const express = require("express");
const router = express.Router();
const isAuth = require("../../middleware/auth.middleware");
const isAdmin = require("../../middleware/admin.middleware");
const {
    getAllLeads,
    markLeadAsSpam
} = require("../../controllers/lead.controller");

// ✅ Get All Leads (Admin Only)
router.get("/", isAuth, isAdmin, getAllLeads);

// ✅ Mark Lead as Spam
router.patch("/:leadId/spam", isAuth, isAdmin, markLeadAsSpam);

module.exports = router;
