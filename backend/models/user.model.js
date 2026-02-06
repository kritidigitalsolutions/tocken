const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  displayName: String,
  city: String,
  state: String,
  country: String,
  locality: String,
  society: String,
  pincode: String,
  lat: String,
  lon: String
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "User"
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      required: true
    },

    firstName: {
      type: String,
      default: ""
    },

    lastName: {
      type: String,
      default: ""
    },

    email: {
      type: String,
      default: "",
      sparse: true  // allows multiple null/empty values
    },

    phone: {
      type: String,
      required: true,
      unique: true
    },

    location: locationSchema,

    profileImage: {
      type: String // Firebase Storage URL
    },

    userType: {
      type: String,
      enum: [
        "AGENT",
        "BUILDER",
        "INDIVIDUAL"
      ],
      default: "INDIVIDUAL"
    },

    isBlocked: {
      type: Boolean,
      default: false
    },

    // Phone Number Privacy - if true, phone is hidden from other users
    isPhonePrivate: {
      type: Boolean,
      default: false
    },

    gstNumber: {
      type: String,
      default: null
    },

    activePlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null
    },

    // Bookmarked/Favorite properties
    bookmarks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property"
    }],

    // Most visited properties (tracked when user views)
    mostVisitedProperties: [{
      property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property"
      },
      viewCount: {
        type: Number,
        default: 1
      },
      lastViewedAt: {
        type: Date,
        default: Date.now
      }
    }],

    // for notification
    fcmToken: {
      type: String,
      default: null
    },


    // Account Deletion Request
    deletionRequest: {
      status: {
        type: String,
        enum: ["NONE", "PENDING", "APPROVED", "REJECTED"],
        default: "NONE"
      },
      reason: {
        type: String,
        enum: [
          "I don't want to use Hexahome any more",
          "I'm using a different account",
          "I rented/sold my property",
          "I'm worried about my privacy",
          "This app is not working properly",
          "My reason is not listed above"
        ]
      },
      feedback: {
        type: String // "Help us to improve" text
      },
      requestedAt: {
        type: Date
      },
      processedAt: {
        type: Date
      },
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
