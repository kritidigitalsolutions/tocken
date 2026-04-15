const Admin = require("../../models/admin.model");
const AdminOTP = require("../../models/AdminOTP.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../../utils/generateToken");
const { sendAdminOtpEmail } = require("../../utils/email.service");
// const permissionsMap = require("../../utils/permissions");

/** Generate a secure 6-digit OTP */
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

exports.sendForgotPasswordOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(200).json({
        success: true,
        message: "If this email is registered, OTP has been sent."
      });
    }

    await AdminOTP.deleteMany({ adminId: admin._id, purpose: "password_change" });

    const otp = generateOtp();
    await AdminOTP.create({
      adminId: admin._id,
      email: admin.email,
      otp,
      purpose: "password_change"
    });

    await sendAdminOtpEmail(admin.email, otp, "password_change", admin.name);

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${admin.email}. Valid for 10 minutes.`
    });
  } catch (error) {
    console.error("❌ sendForgotPasswordOtp error:", error);
    const isConfigError = error.message?.includes("EMAIL_PASS") || error.message?.includes("EMAIL_USER") || error.message?.includes("not configured");
    return res.status(isConfigError ? 503 : 500).json({
      success: false,
      message: isConfigError
        ? "Email service not configured. Set a valid Gmail App Password in EMAIL_PASS."
        : "Failed to send OTP",
      error: error.message
    });
  }
};

exports.resetForgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "email, otp and newPassword are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "newPassword must be at least 6 characters"
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ success: false, message: "Invalid OTP or email" });
    }

    const record = await AdminOTP.findOne({
      adminId: admin._id,
      purpose: "password_change",
      verified: false
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "No pending OTP found. Please request a new OTP."
      });
    }

    if (record.expiresAt < new Date()) {
      await AdminOTP.deleteMany({ adminId: admin._id, purpose: "password_change" });
      return res.status(410).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    if (record.otp !== otp || record.email !== email) {
      return res.status(400).json({ success: false, message: "Invalid OTP or email" });
    }

    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();

    await AdminOTP.deleteMany({ adminId: admin._id, purpose: "password_change" });

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please login with your new password."
    });
  } catch (error) {
    console.error("❌ resetForgotPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message
    });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("🔐 LOGIN ATTEMPT:", { email, password });

    // 1️⃣ Check email
    const admin = await Admin.findOne({ email });
    console.log("👤 Admin found:", admin ? "YES" : "NO");
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("🔑 Password match:", isMatch);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 3️⃣ Generate JWT
    // Backward compatibility: older admin records might not have role set.
    const normalizedRole = String(admin.role || "ADMIN").trim().toUpperCase();
    const token = generateToken({
      id: admin._id,
      role: normalizedRole
    });

    // 4️⃣ Response
    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


/**
 * STEP 1 — SEND OTP
 * POST /api/admin/auth/send-credential-otp
 * Body: { purpose: "email_change"|"password_change", newEmail? }
 * Requires: admin JWT (adminAuth middleware)
 *
 * - Sends OTP to the admin's CURRENT email
 * - For email_change: also validates newEmail is not already taken
 */
exports.sendCredentialOtp = async (req, res) => {
  try {
    const { purpose, newEmail } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!["email_change", "password_change"].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: "purpose must be 'email_change' or 'password_change'"
      });
    }

    // Fetch admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Extra validation for email_change
    if (purpose === "email_change") {
      if (!newEmail || !newEmail.includes("@")) {
        return res.status(400).json({
          success: false,
          message: "A valid newEmail is required for email change"
        });
      }
      // Check new email not already taken
      const existing = await Admin.findOne({ email: newEmail.toLowerCase() });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "This email address is already in use"
        });
      }
    }

    // Delete any previous OTPs for this admin + purpose
    await AdminOTP.deleteMany({ adminId, purpose });

    // Generate and save new OTP
    const otp = generateOtp();
    await AdminOTP.create({
      adminId,
      email: admin.email,
      otp,
      purpose,
      newEmail: purpose === "email_change" ? newEmail.toLowerCase() : null
    });

    // Send email
    await sendAdminOtpEmail(admin.email, otp, purpose, admin.name);

    res.status(200).json({
      success: true,
      message: `OTP sent to ${admin.email}. Valid for 10 minutes.`,
      sentTo: admin.email
    });

  } catch (error) {
    console.error("❌ sendCredentialOtp error:", error);
    // Config errors get a 503 with a helpful message
    const isConfigError = error.message?.includes("EMAIL_PASS") || error.message?.includes("EMAIL_USER") || error.message?.includes("not configured");
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      message: isConfigError
        ? "Email service not configured. Set a valid Gmail App Password in EMAIL_PASS."
        : "Failed to send OTP",
      error: error.message
    });
  }
};


/**
 * STEP 2 — VERIFY OTP
 * POST /api/admin/auth/verify-credential-otp
 * Body: { purpose: "email_change"|"password_change", otp: "123456" }
 * Requires: admin JWT
 *
 * - Verifies the OTP
 * - Marks it as verified so the update step can proceed
 */
exports.verifyCredentialOtp = async (req, res) => {
  try {
    const { purpose, otp } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!purpose || !otp) {
      return res.status(400).json({ success: false, message: "purpose and otp are required" });
    }

    const record = await AdminOTP.findOne({ adminId, purpose, verified: false });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "No pending OTP found. Please request a new OTP first."
      });
    }

    // Check expiry
    if (record.expiresAt < new Date()) {
      await AdminOTP.findByIdAndDelete(record._id);
      return res.status(410).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    // Check match
    if (record.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    // Mark as verified — gives 10 more minutes to complete the update
    record.verified = true;
    record.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await record.save();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. Proceed to update your credentials.",
      purpose,
      newEmail: record.newEmail || undefined
    });

  } catch (error) {
    console.error("❌ verifyCredentialOtp error:", error);
    res.status(500).json({ success: false, message: "OTP verification failed", error: error.message });
  }
};


/**
 * STEP 3 — UPDATE CREDENTIALS
 * POST /api/admin/auth/update-credentials
 * Body (email change):    { purpose: "email_change" }
 * Body (password change): { purpose: "password_change", newPassword: "..." }
 * Body (both):            { purpose: "email_change", newPassword: "..." }
 * Requires: admin JWT
 *
 * - Requires OTP to be verified first (Step 2)
 * - Applies the email or password update (or both)
 * - Invalidates the OTP record after use
 */
exports.updateCredentials = async (req, res) => {
  try {
    const { purpose, newPassword } = req.body;
    const adminId = req.user._id || req.user.id;

    // Find a verified OTP record
    const record = await AdminOTP.findOne({ adminId, purpose, verified: true });

    if (!record) {
      return res.status(403).json({
        success: false,
        message: "OTP not verified. Please complete Step 2 first."
      });
    }

    if (record.expiresAt < new Date()) {
      await AdminOTP.findByIdAndDelete(record._id);
      return res.status(410).json({
        success: false,
        message: "Session expired. Please start over."
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    let emailUpdated = false;
    let passwordUpdated = false;

    // Handle email change
    if (purpose === "email_change") {
      if (!record.newEmail) {
        return res.status(400).json({ success: false, message: "No new email on record" });
      }
      admin.email = record.newEmail;
      emailUpdated = true;
    }

    // Handle password change (can happen with email_change or password_change purpose)
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "newPassword must be at least 6 characters"
        });
      }

      const hashed = await bcrypt.hash(newPassword, 12);
      admin.password = hashed;
      passwordUpdated = true;
    }

    // If purpose is password_change but no password provided
    if (purpose === "password_change" && !newPassword) {
      return res.status(400).json({
        success: false,
        message: "newPassword is required for password change"
      });
    }

    // Save admin updates
    await admin.save();

    // Cleanup OTP
    await AdminOTP.findByIdAndDelete(record._id);

    // Build response message
    let message = "";
    if (emailUpdated && passwordUpdated) {
      message = "Email and password updated successfully";
    } else if (emailUpdated) {
      message = "Email updated successfully";
    } else if (passwordUpdated) {
      message = "Password updated successfully";
    }

    return res.status(200).json({
      success: true,
      message,
      ...(emailUpdated && { newEmail: admin.email })
    });

  } catch (error) {
    console.error("❌ updateCredentials error:", error);
    res.status(500).json({ success: false, message: "Failed to update credentials", error: error.message });
  }
};
