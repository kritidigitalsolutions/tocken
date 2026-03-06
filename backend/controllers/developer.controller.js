const Developer = require("../models/developer.model");
const { uploadToFirebase, deleteFromFirebase } = require("../utils/firebaseUpload");

// ─────────────────────────────────────────────────────────────
// 1  Register / Create Developer Profile
// ─────────────────────────────────────────────────────────────
exports.registerDeveloper = async (req, res) => {
  try {
    const existing = await Developer.findOne({ userId: req.user.id });
    if (existing)
      return res.status(400).json({ success: false, message: "Developer profile already exists. Use PUT /me to update." });

    const {
      nameOfBusiness, nameOfAuthorisedPerson, designation,
      businessPAN, websiteLink,
      email, mobileNo,
      reraNo, gstNo,
      developerProfileDescription
    } = req.body;

    if (!nameOfBusiness || !businessPAN || !email || !mobileNo)
      return res.status(400).json({ success: false, message: "nameOfBusiness, businessPAN, email, mobileNo are required" });

    const developer = await Developer.create({
      userId:     req.user.id,
      nameOfBusiness, nameOfAuthorisedPerson, designation,
      businessPAN, websiteLink,
      email, mobileNo,
      reraNo, gstNo,
      developerProfileDescription,
      isApproved: false
    });

    res.status(201).json({ success: true, message: "Developer profile created successfully", data: developer });
  } catch (error) {
    console.error("ERROR REGISTERING DEVELOPER:", error);
    res.status(500).json({ success: false, message: "Failed to register developer", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 2  Get My Developer Profile
// ─────────────────────────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const developer = await Developer.findOne({ userId: req.user.id }).select("-__v");
    if (!developer)
      return res.status(404).json({ success: false, message: "Developer profile not found. Please register first." });

    res.json({ success: true, data: developer });
  } catch (error) {
    console.error("ERROR FETCHING DEVELOPER PROFILE:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 3  Update My Developer Profile
// ─────────────────────────────────────────────────────────────
exports.updateMyProfile = async (req, res) => {
  try {
    const developer = await Developer.findOne({ userId: req.user.id });
    if (!developer)
      return res.status(404).json({ success: false, message: "Developer profile not found." });

    const editable = [
      "nameOfBusiness", "nameOfAuthorisedPerson", "designation",
      "businessPAN", "websiteLink",
      "email", "mobileNo",
      "reraNo", "gstNo",
      "developerProfileDescription"
    ];
    editable.forEach(f => { if (req.body[f] !== undefined) developer[f] = req.body[f]; });
    await developer.save();

    res.json({ success: true, message: "Profile updated", data: developer });
  } catch (error) {
    console.error("ERROR UPDATING DEVELOPER PROFILE:", error);
    res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 4  Upload Logo
// ─────────────────────────────────────────────────────────────
exports.uploadLogo = async (req, res) => {
  try {
    const developer = await Developer.findOne({ userId: req.user.id });
    if (!developer)
      return res.status(404).json({ success: false, message: "Developer profile not found." });
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file provided" });

    const uploaded = await uploadToFirebase(req.file, "developers/logos");
    developer.logo = uploaded.url;
    await developer.save();

    res.json({ success: true, message: "Logo uploaded", data: { logo: developer.logo } });
  } catch (error) {
    console.error("ERROR UPLOADING LOGO:", error);
    res.status(500).json({ success: false, message: "Failed to upload logo", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 5  Upload Business PAN Document
// ─────────────────────────────────────────────────────────────
exports.uploadBusinessPAN = async (req, res) => {
  try {
    const developer = await Developer.findOne({ userId: req.user.id });
    if (!developer)
      return res.status(404).json({ success: false, message: "Developer profile not found." });
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file provided" });

    const uploaded = await uploadToFirebase(req.file, "developers/pan");
    developer.businessPANUpload = uploaded.url;
    await developer.save();

    res.json({ success: true, message: "PAN document uploaded", data: { businessPANUpload: developer.businessPANUpload } });
  } catch (error) {
    console.error("ERROR UPLOADING PAN:", error);
    res.status(500).json({ success: false, message: "Failed to upload PAN document", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 6  Upload RERA Certificate
// ─────────────────────────────────────────────────────────────
exports.uploadReraCertificate = async (req, res) => {
  try {
    const developer = await Developer.findOne({ userId: req.user.id });
    if (!developer)
      return res.status(404).json({ success: false, message: "Developer profile not found." });
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file provided" });

    const uploaded = await uploadToFirebase(req.file, "developers/rera");
    developer.reraCertificateUpload = uploaded.url;
    await developer.save();

    res.json({ success: true, message: "RERA certificate uploaded", data: { reraCertificateUpload: developer.reraCertificateUpload } });
  } catch (error) {
    console.error("ERROR UPLOADING RERA:", error);
    res.status(500).json({ success: false, message: "Failed to upload RERA certificate", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 7  Upload GST Certificate
// ─────────────────────────────────────────────────────────────
exports.uploadGstCertificate = async (req, res) => {
  try {
    const developer = await Developer.findOne({ userId: req.user.id });
    if (!developer)
      return res.status(404).json({ success: false, message: "Developer profile not found." });
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file provided" });

    const uploaded = await uploadToFirebase(req.file, "developers/gst");
    developer.gstCertificateUpload = uploaded.url;
    await developer.save();

    res.json({ success: true, message: "GST certificate uploaded", data: { gstCertificateUpload: developer.gstCertificateUpload } });
  } catch (error) {
    console.error("ERROR UPLOADING GST:", error);
    res.status(500).json({ success: false, message: "Failed to upload GST certificate", error: error.message });
  }
};
