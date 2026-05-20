const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Get the profile

exports.getProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect("/api/auth/login");
    }

    return res.render("pages/profile", {user});
  } catch (err) {
    console.log(err);
    return res.redirect("/api/auth/login");
  }
};

// profile controller validation

exports.updateProfile = async (req, res) => {
  try {
    let {fullName, email} = req.body;

    fullName = fullName?.trim();
    email = email?.trim().toLowerCase();

    const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName || fullName.length < 3) {
      return res.status(400).json({
        message: "Full name must contain at least 3 characters",
      });
    }

    if (fullName.length > 30) {
      return res.status(400).json({
        message: "Full name cannot exceed 30 characters",
      });
    }

    if (!nameRegex.test(fullName)) {
      return res.status(400).json({
        message: "Full name can contain only letters",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const user = await User.findById(req.user._id);

    if (email === user.email) {
      user.fullName = fullName;

      await user.save();

      return res.json({
        message: "Profile updated",
        requireOtp: false,
      });
    }

    const existingUser = await User.findOne({
      email,
      _id: {$ne: user._id},
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const OTP_VALIDITY = 90 * 1000;

    user.pendingEmail = email;
    user.emailOtp = otp;
    user.emailOtpExpiry = Date.now() + OTP_VALIDITY;

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your new email",
      text: `Your OTP is ${otp}`,
    });

    return res.json({
      message: "OTP sent to new email",
      requireOtp: true,
      expiry: 90,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Verify email otp

exports.verifyEmailOtp = async (req, res) => {
  try {
    const {otp} = req.body;
    const user = await User.findById(req.user._id);

    if (!user.emailOtp || user.emailOtp !== otp) {
      return res.status(400).json({message: "Invalid OTP"});
    }

    if (!user.emailOtpExpiry || user.emailOtpExpiry < Date.now()) {
      return res.status(400).json({message: "OTP expired"});
    }

    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailOtp = null;
    user.emailOtpExpiry = null;

    await user.save();

    res.json({message: "Email updated successfully"});
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

// Resend email otp

exports.resendEmailOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const OTP_VALIDITY = 90 * 1000;

    if (user.emailOtpExpiry && user.emailOtpExpiry > Date.now()) {
      return res.status(400).json({
        message: "Please wait until OTP expires",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailOtp = otp;
    user.emailOtpExpiry = Date.now() + OTP_VALIDITY;

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.pendingEmail || user.email,
      subject: "Resend OTP",
      text: `Your OTP is ${otp}`,
    });

    res.json({
      message: "OTP resent",
      expiry: 90,
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// change password

exports.changePassword = async (req, res) => {
  try {
    const {currentPassword, newPassword, confirmPassword} = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters",
      });
    }

    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must contain uppercase, lowercase, number and special character",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password cannot be same as current password",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user.password) {
      return res.status(400).json({
        message: "Please login with Google",
      });
    }

    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match) {
      return res.status(400).json({message: "Incorrect current password"});
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    req.session.destroy(() => {
      res.json({message: "Password updated. Please login again"});
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

// Forgot password otp

exports.profileForgotPassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const OTP_VALIDITY = 90 * 1000;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + OTP_VALIDITY;

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Forgot Password OTP",
      text: `Your OTP is ${otp}`,
    });

    res.json({
      message: "OTP sent",
      expiry: 90,
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

// verify forgot otp

exports.verifyForgotOtp = async (req, res) => {
  const {otp} = req.body;

  const user = await User.findById(req.user._id);

  if (!user.otp || user.otp !== otp) {
    return res.status(400).json({message: "Invalid OTP"});
  }

  if (!user.otpExpiry || user.otpExpiry < Date.now()) {
    return res.status(400).json({message: "OTP expired"});
  }

  res.json({message: "OTP verified"});
};

// reset password

exports.profileResetPassword = async (req, res) => {
  try {
    const {newPassword, confirmPassword} = req.body;

    const user = await User.findById(req.user._id);

    if (!user.otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({message: "OTP invalid or expired"});
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must contain uppercase, lowercase, number and special character",
      });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({message: "Password reset successful"});
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};
