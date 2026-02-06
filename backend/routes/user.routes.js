const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth.middleware");
const upload = require("../middleware/multer.middleware");
const {
    getProfile,
    updateProfile,
    completeProfile,
    togglePhonePrivacy,
    getPhonePrivacy,
    requestAccountDeletion,
    cancelDeletionRequest,
    getDeletionStatus,
    saveFcmToken,
    trackPropertyView,
    getMostVisitedProperties,
    clearMostVisitedProperties,
} = require("../controllers/user.controller");

// ✅ User Profile - REST APIs
router.get("/profile", isAuth, getProfile);

// Fill user information first time
// Supports both: 
// 1. Raw JSON with profileImage URL 
// 2. Form-data with file upload
router.post("/profile-info", upload.single("profileImage"), completeProfile);

// Update profile (with optional profile image update)
router.patch("/profile-update", isAuth, upload.single("profileImage"), updateProfile);

// ✅ Phone Privacy APIs
router.get("/phone-privacy", isAuth, getPhonePrivacy);
router.patch("/phone-privacy", isAuth, togglePhonePrivacy);

// ✅ Account Deletion APIs
router.get("/deletion-status", isAuth, getDeletionStatus);
router.post("/request-deletion", isAuth, requestAccountDeletion);
router.delete("/cancel-deletion", isAuth, cancelDeletionRequest);

// ✅ FCM Token API
router.post("/fcm-token", isAuth, saveFcmToken);

// ✅ Most Visited Properties APIs
router.post("/property-view", isAuth, trackPropertyView);
router.get("/most-visited-properties", isAuth, getMostVisitedProperties);
router.delete("/most-visited-properties", isAuth, clearMostVisitedProperties);

module.exports = router;
