const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: [
      "AGENT",
      "BUILDER",        // ✅ New: For real estate developers
      "INDIVIDUAL",     // ✅ New: For personal property owners
      "SELLER",
      "LANDLORD",
      "PG OWNER",
      "DEVELOPER",
      "TENANT",
      "CO-LIVING",
      "PG SEEKER"
    ],
    required: true
  },

  planName: {
    type: String, // Pro, Pro Plus
    required: true
  },

  tag: {
    type: String // Most Popular, Best Value
  },

  price: Number,
  originalPrice: Number,

  gstIncluded: {
    type: Boolean,
    default: true
  },

  validityDays: Number,

  // Unified Plan Limit — applies to leads received, property posts & project posts
  planLimit: {
    type: Number,
    default: 0 // 0 = unlimited
  },

  features: [String],


  offerEndsInDays: Number,

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Plan", planSchema);
