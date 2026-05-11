const User = require("../models/user.model");
const OTP = require("../models/OTP.model");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");

const normalizePhone = (phone = "") => {
  let cleanPhone = phone.replace(/[^0-9]/g, "");
  if (!cleanPhone.startsWith("91")) {
    cleanPhone = "91" + cleanPhone;
  }
  return {
    cleanPhone,
    formattedPhoneWithPlus: "+" + cleanPhone
  };
};

const DEMO_USER_PHONE = normalizePhone(process.env.DEMO_USER_PHONE || "9999999999").formattedPhoneWithPlus;

const generateUsername = async () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const generateRandomLetters = (length = 4) => {
    let result = "";
    for (let i = 0; i < length; i += 1) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
  };

  let username;
  do {
    const randomLetters = generateRandomLetters(4);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    username = `${randomLetters}${randNum}`;
  } while (await User.findOne({ username }));

  return username;
};

const ensureDemoUserExists = async (phone) => {
  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    return existingUser;
  }

  const baseUsername = `DEMO${phone.replace(/\D/g, "").slice(-8)}`;
  let username = baseUsername;
  let suffix = 0;

  while (await User.findOne({ username })) {
    suffix += 1;
    username = `${baseUsername}${suffix}`;
  }

  return User.create({
    phone,
    username,
    name: "Demo User",
    firstName: "Demo",
    lastName: "User",
    email: "",
    userType: "INDIVIDUAL"
  });
};

const isRapidSmsTlsError = (error) => {
  const code = error?.code || error?.cause?.code;
  const message = (error?.message || "").toLowerCase();

  return (
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "SELF_SIGNED_CERT_IN_CHAIN" ||
    code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
    message.includes("unable to verify the first certificate") ||
    message.includes("self signed certificate")
  );
};

const getRapidSmsAxiosConfig = () => {
  const config = { timeout: 10000 };
  const certPathFromEnv = process.env.RAPIDSMS_CA_CERT_PATH?.trim();
  const allowInsecureTls = process.env.RAPIDSMS_ALLOW_INSECURE_TLS === "true";

  if (certPathFromEnv) {
    const certPath = path.isAbsolute(certPathFromEnv)
      ? certPathFromEnv
      : path.resolve(process.cwd(), certPathFromEnv);

    config.httpsAgent = new https.Agent({
      ca: fs.readFileSync(certPath),
      rejectUnauthorized: true
    });
  } else if (allowInsecureTls) {
    config.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  return config;
};

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
    const { cleanPhone, formattedPhoneWithPlus } = normalizePhone(phone);

    // Ensure the configured demo user exists, but OTP still follows the same SMS flow.
    if (formattedPhoneWithPlus === DEMO_USER_PHONE) {
      await ensureDemoUserExists(formattedPhoneWithPlus);
    }

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

      let response;
      try {
        response = await axios.get(url.toString(), getRapidSmsAxiosConfig());
      } catch (primarySmsError) {
        if (!isRapidSmsTlsError(primarySmsError)) {
          throw primarySmsError;
        }

        console.warn(
          "RapidSMS TLS chain verification failed. Retrying request with relaxed TLS verification."
        );

        response = await axios.get(url.toString(), {
          timeout: 10000,
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
      }

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

      const isTlsError = isRapidSmsTlsError(smsError);
      if (isTlsError) {
        console.error(
          "RapidSMS TLS verification failed. Configure RAPIDSMS_CA_CERT_PATH with vendor CA or run Node.js with --use-system-ca."
        );
      }

      return res.status(502).json({
        success: false,
        message: isTlsError
          ? "OTP service TLS certificate verification failed on server."
          : "Failed to send OTP",
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
    const { formattedPhoneWithPlus: formattedPhone } = normalizePhone(phone);

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
      const username = await generateUsername();

      user = await User.create({
        phone: formattedPhone,
        username,
        name: "User",
        firstName: "",
        lastName: "",
        email: "",
        userType: "DEVELOPER"
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
      { expiresIn: "365d" }
    );

    return res.status(200).json({
      success: true,
      isNewUser: !user?.name || user.name === "User",
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
