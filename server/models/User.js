const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // select:false = never returned by a normal query. Login asks for it explicitly.
    password: {
      type: String,
      required: true,
      select: false,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    // One-time code for password reset. We store a hash, never the code itself.
    otpHash: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
  },
  {
    timestamps: true,
  }
);

// Even if a password hash is somehow loaded, it is removed whenever
// a user is turned into JSON (i.e. sent to the app).
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.otp;
    delete ret.otpHash;
    delete ret.otpExpiry;
    delete ret.otpAttempts;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
