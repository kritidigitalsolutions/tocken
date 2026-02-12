const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth.middleware");

// Import clean controllers
const { 
    requestLead, 
    getMyLeadRequests 
} = require("../controllers/leadRequest.clean.controller");

const { 
    getMyLeads, 
    updateLeadStatus, 
    getLeadStats 
} = require("../controllers/lead.clean.controller");

// 🔹 A. USER → REQUEST DIRECT LEAD
router.post("/request", isAuth, requestLead);

// 🔹 USER → GET MY LEAD REQUESTS
router.get("/my-requests", isAuth, getMyLeadRequests);

// 🔹 E. USER → MY LEADS (Clean Architecture)
router.get("/my", isAuth, getMyLeads);

// 🔹 F. USER → UPDATE LEAD STATUS
router.patch("/:id", isAuth, updateLeadStatus);

// 🔹 USER → GET LEAD STATS
router.get("/stats", isAuth, getLeadStats);

module.exports = router;