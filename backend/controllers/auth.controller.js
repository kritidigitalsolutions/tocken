const User = require("../models/user.model");
const OTP = require("../models/OTP.model");
const jwt = require("jsonwebtoken");
const axios = require("axios");

/**
 * SEND OTP
 * Generates and sends OTP via RapidSMS
 */
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone || phone.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Phone number required"
      });
    }

    // Format phone number: remove all non-digits, then add country code
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    }
    const formattedPhoneWithPlus = '+' + cleanPhone;

    // Generate 6-digit OTP
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this phone
    await OTP.deleteMany({ phone: formattedPhoneWithPlus });

    // Save OTP to database with expiry (10 minutes)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await OTP.create({
      phone: formattedPhoneWithPlus,
      otp: generatedOTP,
      expiresAt: otpExpiry
    });

    // Send OTP via RapidSMS
    try {
      // Get credentials from .env
      const RAPIDSMS_API_KEY = process.env.RAPIDSMS_API_KEY;
      const RAPIDSMS_SENDER_ID = process.env.RAPIDSMS_SENDER_ID;

      // APPROVED Template #4 (exact match required):
      // "Dear Customer, Your login OTP is {#var#}. Use this OTP to access your account. Please do not share it with anyone. TOKEN"
      const templateMessage = `Dear Customer, Your login OTP is ${generatedOTP}. Use this OTP to access your account. Please do not share it with anyone. TOKEN`;

      // RapidSMS API URL
      const url = new URL('https://1.rapidsms.co.in/api/push');
      url.searchParams.append('apikey', RAPIDSMS_API_KEY);
      url.searchParams.append('sender', RAPIDSMS_SENDER_ID);
      url.searchParams.append('mobileno', cleanPhone);
      url.searchParams.append('text', templateMessage);

      console.log("🚀 Sending OTP to:", cleanPhone);
      console.log("📦 Template Message:", templateMessage);

      const response = await axios.get(url.toString(), { timeout: 10000 });

      console.log("✅ RapidSMS Response:", response.data);

      // Check for error in response
      if (response.data && response.data.status === 'error') {
        throw new Error(response.data.description || "SMS sending failed");
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        phone: formattedPhoneWithPlus
      });

    } catch (smsError) {
      console.error("❌ RapidSMS Error:", smsError.message);
      console.error("Full Error:", smsError.response?.data);

      // In development, return OTP for testing
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          success: true,
          message: "OTP generated (SMS failed - dev mode)",
          phone: formattedPhoneWithPlus,
          debug: { otp: generatedOTP }
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to send OTP",
        error: smsError.message
      });
    }

  } catch (error) {
    console.error("❌ Send OTP Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * VERIFY OTP
 * Verifies OTP and creates/logs in user
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validate inputs
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP required"
      });
    }

    // Format phone number
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    }
    const formattedPhone = '+' + cleanPhone;

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      phone: formattedPhone,
      otp: otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Check if user exists
    let user = await User.findOne({ phone: formattedPhone });

    if (!user) {
      // New user - tell frontend to show profile completion form
      return res.status(200).json({
        success: true,
        isNewUser: true,
        message: "New user. Please complete your profile.",
        phone: formattedPhone
      });
    }

    // Existing user - generate token
    const token = jwt.sign(
      {
        id: user._id,
        phone: user.phone,
        role: "USER"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      isNewUser: false,
      message: "Login successful",
      token,
      user: user
    });

  } catch (error) {
    console.error("❌ Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * RESEND OTP
 * Resends a new OTP to the phone number
 */
exports.resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number required"
      });
    }

    // Call sendOTP function
    return exports.sendOTP(req, res);

  } catch (error) {
    console.error("❌ Resend OTP Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET USER PROFILE
 * Returns logged in user's profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error("❌ Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
