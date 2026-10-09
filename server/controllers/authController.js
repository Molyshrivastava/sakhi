const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const transporter = require("../config/mailer");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72; // bcrypt ignores anything after 72 bytes
const OTP_TTL_MS = 10 * 60 * 1000; // code valid for 10 minutes
const OTP_MAX_ATTEMPTS = 5;

// Used so a "user not found" login takes as long as a "wrong password" one.
const DUMMY_HASH = bcrypt.hashSync("sakhi-dummy-password", 10);

// Match emails ignoring upper/lower case (Moly@x.com == moly@x.com).
const CASE_INSENSITIVE = { locale: "en", strength: 2 };

// ---------- small helpers ----------

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

const hashOtp = (otp) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(String(otp))
    .digest("hex");

// crypto.randomInt is cryptographically secure; Math.random is not.
const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const safeEqual = (a, b) => {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};

function passwordProblem(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    return `Password must be at least ${MIN_PASSWORD} characters.`;
  }
  if (password.length > MAX_PASSWORD) {
    return `Password must be at most ${MAX_PASSWORD} characters.`;
  }
  return null;
}

// Creates a fresh code, saves its hash, and emails the code.
async function issueOtp(user) {
  const otp = generateOtp();

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        otpHash: hashOtp(otp),
        otpExpiry: new Date(Date.now() + OTP_TTL_MS),
        otpAttempts: 0,
      },
    }
  );

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Your Sakhi verification code",
    html: `
      <h2>Sakhi Verification</h2>
      <p>Your verification code is:</p>
      <h1>${otp}</h1>
      <p>This code expires in <b>10 minutes</b>.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}

// Checks the code and, if correct, sets the new password.
// Returns { ok: true } or { status, message }.
async function consumeOtpAndSetPassword(userId, otp, newPassword) {
  const user = await User.findById(userId).select(
    "+otpHash +otpExpiry +otpAttempts"
  );

  const invalid = {
    status: 400,
    message: "Invalid or expired code. Please request a new one.",
  };

  if (!user || !user.otpHash || !user.otpExpiry) return invalid;

  if (user.otpExpiry.getTime() < Date.now()) {
    await User.updateOne(
      { _id: user._id },
      { $unset: { otpHash: "", otpExpiry: "", otpAttempts: "" } }
    );
    return {
      status: 400,
      message: "The code has expired. Please request a new one.",
    };
  }

  if ((user.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
    await User.updateOne(
      { _id: user._id },
      { $unset: { otpHash: "", otpExpiry: "", otpAttempts: "" } }
    );
    return {
      status: 429,
      message: "Too many wrong attempts. Please request a new code.",
    };
  }

  if (!safeEqual(hashOtp(otp), user.otpHash)) {
    await User.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } });
    return { status: 400, message: "Invalid code." };
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await User.updateOne(
    { _id: user._id },
    {
      $set: { password: hashed },
      $unset: { otpHash: "", otpExpiry: "", otpAttempts: "" },
    }
  );

  return { ok: true };
}

// ---------- REGISTER ----------
const registerUser = async (req, res) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = normalizeEmail(body.email);

    if (!name || name.length > 60) {
      return res.status(400).json({ message: "Please enter your name." });
    }

    if (!EMAIL_RE.test(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    const problem = passwordProblem(body.password);
    if (problem) {
      return res.status(400).json({ message: problem });
    }

    const existingUser = await User.findOne({ email }).collation(
      CASE_INSENSITIVE
    );

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // user.toJSON() automatically hides the password.
    res.status(201).json({
      message: "Registration successful",
      user,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

// ---------- LOGIN ----------
const loginUser = async (req, res) => {
  try {
    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please enter your email and password." });
    }

    const user = await User.findOne({ email })
      .collation(CASE_INSENSITIVE)
      .select("+password");

    const isMatch = await bcrypt.compare(
      password,
      user ? user.password : DUMMY_HASH
    );

    if (!user || !isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({
      user,
      token: signToken(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

// ---------- WHO AM I (app calls this on launch to check the session) ----------
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Account not found.", code: "INVALID_TOKEN" });
    }

    res.json({ user });
  } catch (error) {
    console.error("getMe error:", error.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ---------- OTP while logged in (Settings screen) ----------
const sendOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await issueOtp(user);

    res.json({ message: "OTP sent successfully." });
  } catch (err) {
    console.error("sendOTP error:", err.message);
    res.status(500).json({ message: "Failed to send OTP." });
  }
};

const verifyOTPAndChangePassword = async (req, res) => {
  try {
    const { otp, newPassword, confirmPassword } = req.body || {};

    if (!otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all fields." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const problem = passwordProblem(newPassword);
    if (problem) {
      return res.status(400).json({ message: problem });
    }

    const result = await consumeOtpAndSetPassword(
      req.user.id,
      otp,
      newPassword
    );

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("verifyOTP error:", err.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ---------- FORGOT PASSWORD (works when logged OUT) ----------
const forgotPassword = async (req, res) => {
  const genericReply = {
    message: "If an account exists for that email, a code has been sent.",
  };

  try {
    const email = normalizeEmail((req.body || {}).email);

    if (EMAIL_RE.test(email)) {
      const user = await User.findOne({ email }).collation(CASE_INSENSITIVE);
      if (user) {
        await issueOtp(user);
      }
    }
  } catch (err) {
    // We log the problem but still show the same message,
    // so nobody can use this to find out which emails are registered.
    console.error("forgotPassword error:", err.message);
  }

  res.json(genericReply);
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body || {};

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all fields." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const problem = passwordProblem(newPassword);
    if (problem) {
      return res.status(400).json({ message: problem });
    }

    const user = await User.findOne({ email: normalizeEmail(email) }).collation(
      CASE_INSENSITIVE
    );

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired code. Please request a new one." });
    }

    const result = await consumeOtpAndSetPassword(user._id, otp, newPassword);

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("resetPassword error:", err.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// ---------- CHANGE PASSWORD (knows current password) ----------
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all fields." });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const problem = passwordProblem(newPassword);
    if (problem) {
      return res.status(400).json({ message: problem });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("changePassword error:", error.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  sendOTP,
  verifyOTPAndChangePassword,
  forgotPassword,
  resetPassword,
};
