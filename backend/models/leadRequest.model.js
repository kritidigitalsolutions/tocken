const mongoose = require("mongoose");

// 🗂️ LEAD REQUEST MODEL (DEMAND ONLY)
// This represents user requests for leads, not actual leads
const leadRequestSchema = new mongoose.Schema(
    {
        // 🔹 Requester Info
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // 🔹 Request Details (Clean Architecture)
        leadType: {
            type: String,
            enum: ["BUYERS", "RENTERS", "BOTH"],
            required: true
        },

        dealingCities: [{
            type: String,
            required: true
        }],

        propertyTypes: [{
            type: String,
            // enum: ["Apartment", "Villa", "Plot", "Office", "Shop", "Warehouse"],
            required: true
        }],

        // 🔹 Optional Filters
        budgetRange: {
            min: {
                type: Number,
                default: 0
            },
            max: {
                type: Number,
                default: 0
            }
        },

        // 🔹 Request Status Flow
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING"
        },

        // 🔹 Admin Response
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User" // Admin user
        },

        approvedAt: Date,
        rejectionReason: String,

        // 🔹 Request Notes
        requestNotes: String, // User's notes
        adminNotes: String    // Admin's internal notes

    },
    { timestamps: true }
);

// Indexes for performance
leadRequestSchema.index({ requestedBy: 1, status: 1 });
leadRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("LeadRequest", leadRequestSchema);
