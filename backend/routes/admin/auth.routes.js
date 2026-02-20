const express = require("express");
const router = express.Router();

const {
  adminLogin,
  sendCredentialOtp,
  verifyCredentialOtp,
  updateCredentials
} = require("../../controllers/auth/adminAuth.controller");

const isAuth = require("../../middleware/auth.middleware");
const isAdmin = require("../../middleware/admin.middleware");

// Public
router.post("/login", adminLogin);

// Protected — admin must be logged in
// STEP 1: Request OTP (sent to current email)
router.post("/send-credential-otp", isAuth, isAdmin, sendCredentialOtp);

// STEP 2: Verify OTP
router.post("/verify-credential-otp", isAuth, isAdmin, verifyCredentialOtp);

// STEP 3: Apply the credential update
router.post("/update-credentials", isAuth, isAdmin, updateCredentials);

module.exports = router;
