

const FAQ = require("../models/faq.model");

// ✅ PUBLIC: Get all FAQs
exports.getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1 });

    res.status(200).json({
      success: true,
      faqs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
