const mongoose = require("mongoose");
const rangeSchema = new mongoose.Schema({
    min: { type: Number, required: true },
    max: { type: Number, required: true }
}, { _id: false });

const configurationDetailSchema = new mongoose.Schema({

    areaRangeSqft: rangeSchema,

    priceRange: rangeSchema,

    floorPlanFile: {
        type: String // Cloudinary URL
    }

}, { _id: false });

// Each configuration item: { type: "2BHK", details: { ... } }
// NOTE: "type" field must be wrapped in { type: String } to avoid
// Mongoose treating it as a schema type keyword.
const configurationItemSchema = new mongoose.Schema({
    type:    { type: String, required: true },
    details: { type: configurationDetailSchema, default: () => ({}) }
}, { _id: false });

const projectSchema = new mongoose.Schema({

    // ================= DEVELOPER / OWNER =================
    developer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Developer",
        required: true
    },


    // ================= STEP 1 =================
    nameOfProject: {
        type: String,
        required: true
    },

    noOfFloor: Number,
    noOfTower: Number,

    projectStatus: {
        type: String,
        // enum: ["Upcoming", "New launch"],
        required: true
    },

    projectType: [String],
    // **********************************
    // ================= PROJECT CONFIGURATION =================
    projectConfiguration: [configurationItemSchema],
    // officeSpace: {
        // selected: { type: Boolean, default: false },
        // },

    //     officeSpace: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },

    //     shops: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },

    //     showrooms: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },
    //     warehouse: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },

    //     oneBHK: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },

    //     twoBHK: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },

    //     threeBHK: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },
    //     fourBHK: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },
    //     fiveBHK: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },

    //     Apartment: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },

    //     plotLand: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },

    //     villah: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },
    //     independentHouse: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },
    //     builderFloor: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },
    //     others: {
    //         selected: { type: Boolean, default: false },
    //         details: configurationDetailSchema
    //     },
    // },

    // ================= DATES =================
    launchDate: String,
    possessionDate: String,

    // ================= DOCUMENTS =================

    eBrochure: String,

    // ================= LOCATION =================
    projectLocation: {
        fullAddress: { type: String, required: true },
        city: String,
        state: String,
        country: String,
        latitude: Number,
        longitude: Number
    },

    // ================= MEDIA =================
    uploadImage: [{
        type: String,
        required: true
    }],

    otherImages: [String],

    description: String,
    // ================= step 2 over =================


    // ================= STEP 3 - PROJECT FEATURES =================
    // ---------- PROJECT FEATURES ----------
    // Flexible: accepts plain strings OR structured objects
    // e.g. ["RERA Approved", "Vastu Compliant"]
    //  OR  [{ keyHighlights: [...], convenience: [...] }]
    projectFeature:       { type: [mongoose.Schema.Types.Mixed], default: [] },
    productSpecification: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // ---------- AMENITIES ----------
    amenities: [String],

    // ---------- CONNECTIVITY ----------
    connectivity: [String],

    // ================= ADMIN SYSTEM FIELDS =================

    adminStatus: {
        type: String,
        // enum: ["PENDING", "ACTIVE", "REJECTED", "BLOCKED"],
        default: "PENDING",
        index: true
    },

    isFeatured: { type: Boolean, default: false, index: true },
    featuredAt:  { type: Date, default: null },
    activatedAt: { type: Date, default: null },

    rejectionReason: { type: String, default: null },
    adminNote:       { type: String, default: null },

    // Firebase file-name for cleanup on delete
    mainImageFileName: { type: String, default: null },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ── Indexes ──
projectSchema.index({ developer: 1 });
projectSchema.index({ "projectLocation.city": 1 });
projectSchema.index({ projectType: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ nameOfProject: "text", description: "text" });

module.exports = mongoose.model("Project", projectSchema);