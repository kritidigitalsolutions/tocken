const express = require("express");
const router = express.Router();

const {
  getMostPopularCities
} = require("../controllers/admin/mostPopularCities.controller");

// Public route - GET most popular cities (for Flutter app)
// This will return cities with images that admin has uploaded
router.get("/", getMostPopularCities);

module.exports = router;
