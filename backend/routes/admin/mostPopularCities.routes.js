const express = require("express");
const router = express.Router();
const upload = require("../../config/multer");

const {
  getMostPopularCities,
  syncCitiesFromProperties,
  uploadCityImage,
  updateCityStatus,
  deleteCityImage,
  deleteCity
} = require("../../controllers/admin/mostPopularCities.controller");

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed"
    });
  }
  next();
};

// Routes - middleware applied at app.js level (isAuth + isAdmin)

// GET all popular cities with images
router.get("/", getMostPopularCities);

// SYNC cities from properties collection (aggregate and update database)
router.post("/sync", syncCitiesFromProperties);

// UPLOAD image for a specific city
router.post(
  "/:id/upload-image", 
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed"
        });
      }
      next();
    });
  },
  uploadCityImage
);

// UPDATE city status (active/inactive)
router.patch("/:id/status", updateCityStatus);

// DELETE city image
router.delete("/:id/image", deleteCityImage);

// DELETE city entry
router.delete("/:id", deleteCity);

module.exports = router;
