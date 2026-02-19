const mongoose = require("mongoose");

/**
 * Most Popular Cities Model
 * Stores city information with uploaded images and property counts
 */
const mostPopularCitiesSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    
    totalProperties: {
      type: Number,
      default: 0
    },
    
    imageUrl: {
      type: String,
      default: null // Will be uploaded by admin
    },
    
    imageName: {
      type: String,
      default: null // Firebase file name for deletion
    },
    
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Additional metadata
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
mostPopularCitiesSchema.index({ city: 1 });
mostPopularCitiesSchema.index({ totalProperties: -1 });

module.exports = mongoose.model("MostPopularCities", mostPopularCitiesSchema);
