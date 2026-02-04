const Legal = require("../../models/Legal.model")

/**
 * CREATE or UPDATE LEGAL PAGE
 */
exports.upsertLegal = async (req, res) => {
  try {
    const { type } = req.params;
    let { content, status } = req.body;

    // Normalize status
    status = status?.toLowerCase() === "active" ? "Active" : "Draft";

    const legal = await Legal.findOneAndUpdate(
      { type },
      { content, status },
      {
        new: true,
        upsert: true, // 🔥 create if not exists
      }
    );

    res.status(200).json({
      success: true,
      legal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};