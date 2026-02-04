const mongoose = require("mongoose");

/**
 * FilterProperty Collection
 * 
 * This collection stores only ACTIVE (approved) properties
 * Properties are copied here when admin approves them
 * Filter API fetches from this collection for faster queries
 */

const filterPropertySchema = new mongoose.Schema(
  {
    // Reference to original property
    originalPropertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      unique: true
    },

    // User who posted
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Basic Info
    listingType: {
      type: String,
      required: true,
      index: true
    },
    propertyType: String,
    propertyCategory: String,

    // All Details (copied from original)
    residentialDetails: mongoose.Schema.Types.Mixed,
    commercialDetails: mongoose.Schema.Types.Mixed,
    pgDetails: mongoose.Schema.Types.Mixed,
    coLivingDetails: mongoose.Schema.Types.Mixed,

    // Pricing
    pricing: mongoose.Schema.Types.Mixed,

    // Location
    location: {
      city: { type: String, index: true },
      locality: { type: String, index: true },
      society: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },

    // Contact
    contact: mongoose.Schema.Types.Mixed,

    // Media
    images: [
      {
        url: String,
        publicId: String,
        isPrimary: { type: Boolean, default: false }
      }
    ],
    description: String,

    // Scores & Rankings
    listingScore: { type: Number, default: 0, index: true },

    // Premium Features
    isPremium: { type: Boolean, default: false, index: true },
    premium: {
      startDate: Date,
      endDate: Date,
      plan: String,
      boostRank: Number
    },

    // Timestamps from original
    originalCreatedAt: Date,
    approvedAt: { type: Date, default: Date.now },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    }
  },
  { 
    timestamps: true,
    collection: "filterproperties" // Explicit collection name
  }
);

// Indexes for fast filtering
filterPropertySchema.index({ listingType: 1, "location.city": 1 });
filterPropertySchema.index({ listingType: 1, propertyType: 1 });
filterPropertySchema.index({ isPremium: -1, listingScore: -1, createdAt: -1 });
filterPropertySchema.index({ "location.city": 1, "location.locality": 1 });
filterPropertySchema.index({ "pricing.rent.rentAmount": 1 });
filterPropertySchema.index({ "pricing.sell.expectedPrice": 1 });
filterPropertySchema.index({ "residentialDetails.bhkType": 1 });
filterPropertySchema.index({ "pgDetails.pgFor": 1 });
filterPropertySchema.index({ "coLivingDetails.gender": 1 });

module.exports = mongoose.model("FilterProperty", filterPropertySchema);
