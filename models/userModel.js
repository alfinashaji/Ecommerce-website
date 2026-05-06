const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function () {
        return this.provider !== "google";
      },
    },

    referralCode: {
      type: String,
      default: null,
    },

    wallet: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "inactive",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },

    otpExpiry: {
      type: Date,
      default: null,
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    profileImage: {
      type: String,
      default: null,
    },

    pendingEmail: {
      type: String,
      default: null,
    },
    emailOtp: {
      type: String,
      default: null,
    },
    emailOtpExpiry: {
      type: Date,
      default: null,
    },
    profilePic: {
      type: String,
      default: "default.png",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
