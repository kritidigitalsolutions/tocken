 const mongoose = require("mongoose");

const mostVisitedSchema = new mongoose.Schema(
  {
    // Property reference
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      unique: true
    },

    // Global view statistics
    totalViews: {
      type: Number,
      default: 1
    },

    // Track unique users who viewed (for analytics)
    uniqueViewers: {
      type: Number,
      default: 1
    },

    // When was last viewed
    lastViewedAt: {
      type: Date,
      default: Date.now
    },

    // Store recent viewer IDs (limited to last 100 for performance)
    recentViewers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      viewedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

// Indexes for performance
mostVisitedSchema.index({ totalViews: -1 });
mostVisitedSchema.index({ lastViewedAt: -1 });
mostVisitedSchema.index({ propertyId: 1 });

// Limit recentViewers array to last 100 entries
mostVisitedSchema.pre('save', function() {
  if (this.recentViewers && this.recentViewers.length > 100) {
    this.recentViewers = this.recentViewers.slice(-100);
  }
});

module.exports = mongoose.model("MostVisited", mostVisitedSchema);