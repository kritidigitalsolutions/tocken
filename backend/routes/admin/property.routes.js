const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/property.controller");
const adminAuth = require("../../middleware/admin.middleware");
const permit = require("../../middleware/permission.middleware");

// All listings
router.get("/", adminAuth, controller.getAll);

// Get properties of a specific user
router.get("/user/:userId", adminAuth, controller.getUserProperties);

// Single listing
router.get("/:id", adminAuth, controller.getOne);

// Update property details
router.put("/:id", adminAuth, controller.updateProperty);

// Change status
router.patch("/:id/status", adminAuth, controller.updateStatus);

// Permanent delete (for all pages - no soft delete)
router.delete(
  "/:id", 
  adminAuth, 
  permit("PROPERTY_DELETE"), 
  controller.permanentDeleteProperty
);

// Restore soft deleted property
router.patch("/:id/restore", adminAuth, controller.restoreProperty);

// Make premium / remove premium
router.patch("/:id/premium", adminAuth, controller.makePremium);
router.patch("/:id/remove-premium", adminAuth, controller.removePremium);

//  patch for make premium with permission check 
router.patch(
  "/:id/premium",
  adminAuth,
  permit("PREMIUM_GRANT"),
  controller.makePremium
);

module.exports = router;
