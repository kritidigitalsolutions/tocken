const mongoose = require("mongoose");

/**
 * AdminOTP — stores short-lived OTPs for admin credential updates
 * Auto-deletes after 10 minutes via TTL index
 */
const adminOtpSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true
    },

    otp: {
      type: String,
      required: true
    },

    // "email_change" | "password_change"
    purpose: {
      type: String,
      enum: ["email_change", "password_change"],
      required: true
    },

    // For email change — the new email being verified
    newEmail: {
      type: String,
      default: null,
      lowercase: true
    },

    // Whether OTP was successfully verified (allows the update step)
    verified: {
      type: Boolean,
      default: false
    },

    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 min
      index: { expires: 0 }  // MongoDB TTL auto-delete
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminOTP", adminOtpSchema);
