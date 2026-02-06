const Banner = require("../models/Banner.model");

/**
 * PUBLIC BANNER CONTROLLER
 * For Mobile App Users - Read Only Access
 * Only returns ACTIVE banners
 */

// GET all active banners (for users/mobile app)
exports.getBanners = async (req, res) => {
  try {
    // Only return active banners for public users
    const banners = await Banner.find({ status: "Active" })
      // .select("title image show")
      // .sort({ createdAt: 2 });

    res.json({
      success: true,
      count: banners.length,
      banners
    });
  } catch (error) {
    console.error("Get banners error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
