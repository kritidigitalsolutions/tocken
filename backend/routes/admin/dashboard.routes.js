const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/dashboard.controller");
const adminAuth = require("../../middleware/admin.middleware");

// 🎯 New comprehensive analytics endpoint
router.get("/analytics", adminAuth, controller.getDashboardAnalytics);

// 📊 Visitor statistics
router.get("/visitors", adminAuth, controller.getVisitorStats);

// 📋 Activity logs
router.get("/activity", adminAuth, controller.getActivityLogs);

// 🔄 Legacy dashboard data (backward compatibility)
router.get("/", adminAuth, controller.getDashboardData);

module.exports = router;
