const mongoose = require("mongoose");

/* ===== COMMON SUB-SCHEMAS ===== */

const furnishingSchema = {
  type: {
    type: String,
    // enum: ["none", "semiFurnished", "fullyFurnished"],
    // default: "none"
  },
  amenities: [
    {
      name: String,        // Fan, AC, Bed
      quantity: Number
    }
  ]
};

const parkingSchema = {
  parkingDetails: [
    {
      label: String,
      value: Number
    }
  ]
}

const areaSchema = {
  builtUp: {
    value: Number,
    unit: String,
  },
  carpet: {
    value: Number,
    unit: String,
  },
  plot: {
    value: Number,
    value: Number,
    length: Number,
    width: Number,
    roadWidth: Number
  }
};

/* ===== MAIN SCHEMA ===== */

const propertySchema = new mongoose.Schema(
  {
    /* ===== BASIC ===== */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    listingType: {
      type: String,
      // enum: ["RENT", "SELL", "PG", "CO_LIVING"],
      required: true
    },

    propertyType: {
      type: String,
      // enum: ["RESIDENTIAL", "COMMERCIAL"]
    },

    propertyCategory: String,

    status: {
      type: String,
      // enum: ["PENDING", "ACTIVE", "REJECTED", "BLOCKED"],
      default: "PENDING"
    },

    /* ===== RESIDENTIAL ===== */
    residentialDetails: {
      propertyType: String,
      // for sell property
      constructionStatus: String,
      statusValue: String,
      // for sell property
      ageOfProperty: String,
      bhkType: String,
      bathrooms: String,
      balconies: String,
      additionalRooms: [String],

      furnishing: furnishingSchema,

      facing: String,
      flooring: String,
      ownership: String,
      area: areaSchema,

      parking: parkingSchema,

      totalFloors: Number,
      yourFloor: Number,
      isBroker: Boolean,
      preferredTenants: [String],
      availableFrom: String,

      // Geospatial coordinates for nearby search
      coordinates: {
        type: {
          type: String,
          // enum: ["Point"],
          default: "Point"
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0]
        }
      }
    },

    /* ===== COMMERCIAL ===== */
    commercialDetails: {
      propertyType: String,
      constructionStatus: String,
      statusValue: String,
      washrooms: String,
      suitableFor: [String],
      locationHub: String,
      zoneType: String,
      propertyCondition: {
        type: String,
        // enum: ["readyToUse", "bareShell"]
      },

      // for Plot/Land
      plot: {
        area: Number,
        unit: String
      },
      dimensions: {
        length: String,
        width: String,
        widthOfFacingRoad: String
      },
      numberOfOpenSide: String,
      dueConstruction: String,
      constructionType: String,
      boundaryWall: Boolean,
      cornerPlot: Boolean,
      BrokerReachOut: Boolean,
      // end Plot/Land model line
      constructionStatusOfWall: String,

      furnishing: furnishingSchema,
      area: areaSchema,

      facing: String,
      flooring: String,
      ownership: String,

      fireSafety: [String],
      occupancyCertificate: Boolean,
      nocCertified: Boolean,

      // Office Layout
      officeSetup: {
        cabins: Number,
        meetingRooms: Number,
        seats: Number
      },

      // Available Features (from UI)
      availableFeatures: {
        // Reception Area
        receptionArea: {
          isAvailable: Boolean
        },
        // Pantry
        pantry: {
          isAvailable: Boolean,
          type: { type: String, },
          size: Number, // in sqft
          unit: String
        },
        // Conference Room
        conferenceRoom: {
          isAvailable: Boolean,
          count: String
        },
        // Washrooms
        washrooms: {
          isAvailable: Boolean,
          privateCount: String,
          publicCount: String
        },
        // Amenities Toggles
        centralAC: Boolean,
        ups: Boolean,
        oxygenDuct: Boolean,
        furnished: Boolean
      },

      // Lifts
      lifts: {
        passengerLifts: String,
        serviceLifts: String
      },

      // Parking
      parking: {
        isAvailable: String,
        parkingType: [String],
        numberOfParking: Number
      },

      totalFloors: Number,
      yourFloor: Number,
      isBroker: Boolean,
      availableFrom: String
    },

    /* ===== PG ===== */
    pgDetails: {
      pgName: String,
      pgFor: {
        type: String,
        // enum: ["male", "female", "all"]
      },
      bestSuitedFor: [String],
      totalFloors: Number,

      roomTypes: [
        {
          sharingType: String,
          roomsAvailable: Number,
          rentAmount: Number,
          securityDepositType: String,
          amountOrMonth: Number,
          attachedBathroom: Boolean,
          attachedBalcony: Boolean
        }
      ],

      furnishing: furnishingSchema,

      food: {
        included: Boolean,
        meals: [String]
      },

      parking: {
        covered: Number,
        open: Number
      },
      managedBy: String,
      managerStaysAtPG: Boolean,
      availableFrom: String,
      includedServices: [String],
      noticePeriod: Number,
      lockInPeriod: String,
      month: Number,

    },

    /* ===== CO-LIVING ===== */
    coLivingDetails: {
      profileImage: String,
      name: String,
      mobileNumber: String,
      isPhonePrivate: { type: Boolean, default: false },
      dateOfBirth: String,
      gender: String,
      occupation: String,
      occupationName: String,
      languages: String,
      hobbies: String,
      lookingToShiftBy: String,
      availableFrom: String,
      bhk: String,
      furnishing: furnishingSchema,
      roomDetails: [String],
      totalFloors: Number,
      yourFloor: Number,
      amenities: [String],
      // 
      budgetRange: {
        min: Number,
        max: Number
      },
      // 
      partnerGender: String,
      ageLimit: {
        min: String,
        max: String
      },
      partnerOccupation: [String],
      preferences: [String],
      instagramLink: String,
      FacebookLink: String,
      LinkedInLink: String,
    },

    /* ===== PRICING ===== */
    pricing: {
      // for sell residential property
      sell: {
        pricePerSqrFt: Number,
        expectedPrice: Number,
        istaxAndGov: Boolean,
        isUpsAndDg: Boolean,
        isNegotiable: Boolean,
        // for plot/Land pricing
        hotDeal: {
          isHotDeal: Boolean,
          spacifyDiscount: Number,
          spacialPricingValid: String,
          isFinancing: Boolean,
        }
        // for plot/Land pricing end line
      },
      // end sell residential property section
      rent: {
        pricingRoomtype: String,
        rentAmount: Number,
        leaseAmount: Number,
        numberOfYearLease: String,
        isElectricity: Boolean,
        isNegotiable: Boolean,
        istaxAndGov: Boolean,
        YearlyRentIncreaseByPercent: Number    // for commercial office case
      },
      salePrice: Number,

      // amenities: [
      //   {
      //     label: String,
      //     amount: Number
      //   }
      // ],

      securityDeposit: {
        depositType: String,
        amount: Number
      },

      noticePeriod: Number,

      lockInPeriod: {
        label: String,
        month: Number
      },
      // only for PG Details
      mealsAvailable: String,
      mealsType: String,
      mealsAvailableOnWeekDay: [String],
      mealsAmount: Number,
      // end  PG Details

      addMore:
      {
        maintenanceCharge: Number,
        bookingAmount: Number,
        otherCharge: Number
      }
    },

    /* ===== LOCATION ===== */
    location: {
      city: String,
      locality: String,
      society: String
    },

    /* ===== CONTACT ===== */
    contact: {
      name: String,
      phone: String,
      email: String,
      phonePrivate: Boolean,
      amenities: [String],
      preferences: [String],

      // for PG details
      pgRules: [String],
      LastEntryTime: String,
      CommonArea: [String]
      // end PG details

    },


    /* ===== MEDIA ===== */
    images: [
      {
        url: String,
        publicId: String,
        isPrimary: { type: Boolean, default: false }
      }
    ],

    description: String,


    /* ===== ADMIN ===== */
    listingScore: { type: Number, default: 0 },

    flags: {
      suspicious: { type: Boolean, default: false }
    },

    /* ===== SOFT DELETE ===== */
    isDeleted: { type: Boolean, default: false },

    /* ===== PREMIUM ===== */
    isPremium: { type: Boolean, default: false },
    premium: {
      startDate: Date,
      endDate: Date,
      plan: String
    }
  },
  { timestamps: true }
);

/* ===== INDEXES ===== */
propertySchema.index({ listingType: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ "location.city": 1 });
propertySchema.index({ listingScore: -1 });
propertySchema.index({ createdAt: -1 });
// Geospatial index for nearby search
propertySchema.index({ "residentialDetails.coordinates": "2dsphere" });

module.exports = mongoose.model("Property", propertySchema);