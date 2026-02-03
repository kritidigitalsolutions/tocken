const express = require("express");
const router = express.Router();
const controller = require("../controllers/property.controller");
const filterController = require("../controllers/propertyFilter.controller");
const auth = require("../middleware/auth.middleware");
const upload = require("../middleware/multer.middleware");

// ===== PUBLIC ROUTES (For Flutter App) =====

// Search locations for filter dropdown (OpenStreetMap)
router.get("/locations ", filterController.searchLocationsForFilter);

// Filter properties (main filter API for app)
router.get("/filter", filterController.filterProperties);

// Search properties by keyword
router.get("/search", filterController.searchProperties);

// Get nearby properties by location
router.get("/nearby", filterController.getNearbyProperties);

// Get property details by ID
router.get("/:id", filterController.getPropertyById);

// ===== PROTECTED ROUTES (Requires Login) =====

// Get my properties
router.get("/user/my", auth, filterController.getMyProperties);

// Create property (PENDING status)
router.post("/", auth, controller.createProperty);

// Update any step
router.put("/:id", auth, controller.updateProperty);

// Submit final
router.post("/:id/submit", auth, controller.submitProperty);

// Upload photos
router.post(
  "/:id/photos",
  auth,
  upload.array("photos", 10),
  controller.uploadPhotos
);

// Set primary photo
router.patch(
  "/:id/photos/:photoId/primary",
  auth,
  controller.setPrimaryPhoto
);

// Delete photo
router.delete(
  "/:id/photos/:photoId",
  auth,
  controller.deletePhoto
);

module.exports = router;
