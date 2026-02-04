
const Legal = require("../models/Legal.model");

/**
 * GET LEGAL PAGE (privacy / terms)
 */
exports.getLegal = async (req, res) => {
  try {
    const { type } = req.params;

    const legal = await Legal.findOne({ type });

    if (!legal) {
      return res.status(404).json({
        message: "Legal page not found",
      });
    }

    res.status(200).json({
      success: true,
      legal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


