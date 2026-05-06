const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

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

// Update profile email otp

exports.updateProfile = async (req, res) => {
  try {
    const {fullName, email} = req.body;

    const user = await User.findById(req.user._id);

    if (email === user.email) {
      user.fullName = fullName;
      await user.save();

      return res.json({
        message: "Profile updated",
        requireOtp: false,
      });
    }

    // check duplicate email
    const existingUser = await User.findOne({
      email,
      _id: {$ne: user._id},
    });

    if (existingUser) {
      return res.status(400).json({message: "Email already in use"});
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
      expiry: user.emailOtpExpiry,
    });
  } catch (error) {
    res.status(500).json({message: error.message});
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
      expiry: user.emailOtpExpiry,
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
      return res.status(400).json({message: "All fields required"});
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({message: "Passwords do not match"});
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
      expiry: user.otpExpiry,
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

    if (newPassword !== confirmPassword) {
      return res.status(400).json({message: "Passwords do not match"});
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
