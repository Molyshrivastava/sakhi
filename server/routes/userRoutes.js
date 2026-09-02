const express = require("express");

const router = express.Router();
const verifyToken = require("../middleware/auth");
const {
  registerUser,
  loginUser,
  changePassword,
   sendOTP,
   verifyOTPAndChangePassword,
} = require("../controllers/authController");

router.post("/register", registerUser);

router.post("/login", loginUser);

router.put("/change-password", verifyToken, changePassword);

router.post(
  "/send-otp",
  verifyToken,
  sendOTP
);

router.put(
  "/verify-otp",
  verifyToken,
  verifyOTPAndChangePassword
);

module.exports = router;