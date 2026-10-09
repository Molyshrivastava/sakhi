const express = require("express");

const router = express.Router();
const verifyToken = require("../middleware/auth");
const {
  loginLimiter,
  registerLimiter,
  otpLimiter,
} = require("../middleware/rateLimiters");
const {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  sendOTP,
  verifyOTPAndChangePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// Public
router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password", otpLimiter, resetPassword);

// Needs login
router.get("/me", verifyToken, getMe);
router.put("/change-password", verifyToken, changePassword);
router.post("/send-otp", verifyToken, otpLimiter, sendOTP);
router.put("/verify-otp", verifyToken, otpLimiter, verifyOTPAndChangePassword);

module.exports = router;
