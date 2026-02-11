const mongoose = require("mongoose");

const leadRequestSchema = new mongoose.Schema(
    {
        // Requester Info
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Request Details
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
            required: true
        }],

        // Additional Filters (optional)
        budgetRange: {
            min: Number,
            max: Number
        },

        // Request Status
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "FULFILLED"],
            default: "PENDING"
        },

        // Admin Response
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin"
        },

        approvedAt: Date,

        rejectionReason: String,

        // Leads Sent
        leadsAssigned: {
            type: Number,
            default: 0
        },

        assignedLeadIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead"
        }],

        // Notes
        requestNotes: String, // User's notes
        adminNotes: String    // Admin's internal notes

    },
    { timestamps: true }
);

// Indexes
leadRequestSchema.index({ userId: 1, status: 1 });
leadRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("LeadRequest", leadRequestSchema);
