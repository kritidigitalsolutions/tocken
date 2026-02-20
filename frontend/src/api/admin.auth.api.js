import API from "./api";

// Step 1: Send OTP to admin's current email
// purpose: "email_change" | "password_change"
// newEmail: required only when purpose === "email_change"
export const sendCredentialOtp = (purpose, newEmail = null) =>
  API.post("/admin/auth/send-credential-otp", { purpose, newEmail });

// Step 2: Verify OTP
export const verifyCredentialOtp = (purpose, otp) =>
  API.post("/admin/auth/verify-credential-otp", { purpose, otp });

// Step 3: Apply the change
// For email_change: no extra params needed
// For password_change: send { newPassword }
export const updateCredentials = (purpose, payload = {}) =>
  API.post("/admin/auth/update-credentials", { purpose, ...payload });
