const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────
//  PAYMENT MODEL  (PhonePe PG)
// ─────────────────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema(
  {
    // ── User ──
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // ── Plan ──
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true
    },

    // ── IDs ──
    merchantOrderId: {
      type: String,
      required: true,
      unique: true   // our generated ID — "ORD_<userId>_<timestamp>"
    },

    phonepeOrderId: {
      type: String,
      default: null  // PhonePe internal orderId from create-payment response
    },

    phonepeTransactionId: {
      type: String,
      default: null  // PhonePe transactionId from status check
    },

    // ── Amount in paise (INR × 100) ──
    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    // ── Status ──
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING"
    },

    // ── Plan snapshot (in case plan changes later) ──
    planSnapshot: {
      planName:      String,
      price:         Number,
      validityDays:  Number,
      leadsPerMonth: Number,
      userType:      String
    },

    // ── Raw PhonePe status response ──
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    failureReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
