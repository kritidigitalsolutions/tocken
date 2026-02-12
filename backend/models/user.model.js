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

    // Plan Subscription Details
    planSubscription: {
      startDate: {
        type: Date,
        default: null
      },
      endDate: {
        type: Date, 
        default: null
      },
      isActive: {
        type: Boolean,
        default: false
      },
      autoRenewal: {
        type: Boolean,
        default: false
      }
    },

    // Bookmarked/Favorite properties
    bookmarks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property"
    }],

    // for notification
    fcmToken: {
      type: String,
      default: null
    },

    // Lead Quota Tracking (for Agents/Owners)
    leadQuota: {
      consumed: {
        type: Number,
        default: 0
      },
      limit: {
        type: Number,
        default: 0 // 0 = unlimited
      },
      resetDate: {
        type: Date,
        default: null
      }
    },


    // Account Deletion Request
    deletionRequest: {
      status: {
        type: String,
        // enum: ["NONE", "PENDING", "APPROVED", "REJECTED"],
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
