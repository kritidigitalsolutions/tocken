const mongoose = require("mongoose");

const developerSchema = new mongoose.Schema({

  // ================= LINKED USER ACCOUNT =================

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // ================= LOGO / DISPLAY =================

  logo: {
    type: String // Cloudinary / Firebase URL
  },

  // ================= BASIC DETAILS =================

  nameOfBusiness: {
    type: String,
    required: true
  },

  nameOfAuthorisedPerson: {
    type: String
  },

  designation: {
    type: String
  },

  businessPAN: {
    type: String,
    required: true
  },

  businessPANUpload: {
    type: String // Cloudinary URL
  },

  websiteLink: {
    type: String
  },

  // ================= CONTACT DETAILS =================

  email: {
    type: String,
    required: true
  },

  emailVerified: {
    type: Boolean,
    default: false
  },

  mobileNo: {
    type: String,
    required: true
  },

  mobileVerified: {
    type: Boolean,
    default: false
  },

  // ================= LEGAL DETAILS =================

  reraNo: {
    type: String
  },

  reraCertificateUpload: {
    type: String // File URL
  },

  gstNo: {
    type: String
  },

  gstCertificateUpload: {
    type: String // File URL
  },

  // ================= PROFILE DESCRIPTION =================

  developerProfileDescription: {
    type: String
  },

  // ================= SYSTEM FIELDS =================

  isApproved: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Developer", developerSchema);