const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth.middleware");
const {
    createLead,
    getMyLeads,
    unlockLead,
    updateLeadStatus,
    deleteLead
} = require("../controllers/lead.controller");

// ✅ Create Lead (Public or Authenticated)
router.post("/create", isAuth, createLead);

// ✅ Get My Leads (For Property Owners/Agents)
router.get("/my-leads", isAuth, getMyLeads);

// ✅ Unlock Lead (Consume quota)
router.post("/:leadId/unlock", isAuth, unlockLead);

// ✅ Update Lead Status
router.patch("/:leadId/status", isAuth, updateLeadStatus);

// ✅ Delete Lead
router.delete("/:leadId", isAuth, deleteLead);

module.exports = router;
