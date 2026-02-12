const mongoose = require("mongoose");

// 🔥 LEAD MODEL (ACTUAL VALUE) - Clean Architecture
// Lead = Buyer/Renter contact assigned by admin
const leadSchema = new mongoose.Schema(
  {
    // 🔗 Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // AGENT, BUILDER, INDIVIDUAL
      required: true
    },

    // 🔹 Lead Type & Contact
    leadType: {
      type: String,
      enum: ["BUYER", "RENTER"],
      required: true
    },

    buyerName: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    city: {
      type: String,
      required: true
    },

    requirement: {
      type: String,
      required: true // "2BHK for rent", "Villa under 50L"
    },

    // 🔗 Property Reference (NOT the lead itself)
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null // Optional reference only
    },

    // 🔹 Status Tracking
    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "CLOSED"],
      default: "NEW"
    },

    source: {
      type: String,
      default: "ADMIN" // All leads come from admin
    }

    // ❌ NO ownerId - intentionally removed
    // ❌ NO isSpam - admin controls quality
  },
  { timestamps: true }
);
// Indexes for performance
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ leadType: 1 });

module.exports = mongoose.model("Lead", leadSchema);
