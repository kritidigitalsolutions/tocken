const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth.middleware");
const {
    createLeadRequest,
    getMyLeadRequests
} = require("../controllers/leadRequest.controller");

// ✅ Create Lead Request
router.post("/create", isAuth, createLeadRequest);

// ✅ Get My Lead Requests
router.get("/my-requests", isAuth, getMyLeadRequests);

module.exports = router;
