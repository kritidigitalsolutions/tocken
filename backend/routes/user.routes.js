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
    // cancelDeletionRequest,
    getDeletionStatus,
    saveFcmToken,
    trackPropertyView,
    getMostVisitedProperties,
    debugMostVisited,
    getRecentlyAddedProperties,
    getMostLikedProperties,
    getMostPopularCities,
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
// router.delete("/cancel-deletion", isAuth, cancelDeletionRequest);

// ✅ FCM Token API
router.post("/fcm-token", isAuth, saveFcmToken);

// ✅ Global Most Visited Properties APIs  
router.post("/property-view", isAuth, trackPropertyView);
router.get("/most-visited-properties", isAuth, getMostVisitedProperties);
router.get("/debug-most-visited", isAuth, debugMostVisited); // Debug API

// ✅ Recently Added Properties (Simple API)
router.get("/recently-added-properties", isAuth, getRecentlyAddedProperties);

// ✅ Most Liked Properties (Bookmark Analysis)
router.get("/most-liked-properties", isAuth, getMostLikedProperties);

// ✅ Most Popular Cities (Properties from top cities by count)
// router.get("/most-popular-cities", isAuth, getMostPopularCities);

module.exports = router;
