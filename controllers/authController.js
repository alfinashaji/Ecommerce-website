const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

//signup
const signup = async (req, res) => {
  try {
    const {fullName, email, password, referralCode} = req.body;

    const existingUser = await User.findOne({email});

    if (existingUser) {
      req.session.error = "User alredy exists";
      return res.redirect("/api/auth/signup");
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashed,
      referralCode: referralCode || "",
      isVerified: false,
      status: "inactive",
    });

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.otp = otp;
    user.otpExpiry = Date.now() + 90 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
    });

    return res.redirect(`/api/auth/verify-otp?email=${email}`);
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// Resend OTP
const resendOtp = async (req, res) => {
  try {
    const {email} = req.body;

    const user = await User.findOne({email});

    if (!user) {
      req.session.error = "User not found";
      return res.redirect("/api/auth/signup");
    }

    if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt < 30 * 1000) {
      req.session.error = "Please wait before resending OTP";
      return res.redirect("/api/auth/verify-otp?email=" + email);
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.otp = otp;
    user.otpExpiry = Date.now() + 90 * 1000;
    user.lastOtpSentAt = Date.now();

    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Resend OTP",
      text: `Your new OTP is: ${otp}`,
    });

    req.session.success = "OTP resent successfully";

    return res.redirect("/api/auth/verify-otp?email=" + email);
  } catch (error) {
    req.session.error = "Error resending OTP";
    return res.redirect("/api/auth/verify-otp?email=" + req.body.email);
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const {email, otp} = req.body;

    const user = await User.findOne({email});

    if (!user) {
      req.session.error = "User Not found";
      return res.redirect("/api/auth/signup");
    }

    if (String(user.otp) !== String(otp)) {
      req.session.error = "Invalid OTP";
      return res.redirect("/api/auth/verify-otp?email=" + email);
    }

    if (user.otpExpiry < Date.now()) {
      req.session.error = "OTP expired";
      return res.redirect("/api/auth/verify-otp?email=" + email);
    }

    user.isVerified = true;
    user.status = "active";
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return res.redirect("/api/auth/login");
  } catch (error) {
    return res.status(500).json({
      message: "Error verifying OTP",
      error: error.message,
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const {email} = req.body;

    const user = await User.findOne({email});

    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.otp = otp;
    user.otpExpiry = Date.now() + 90 * 1000;

    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Forgot Password OTP",
      text: `Your OTP is ${otp}`,
    });

    return res.redirect(`/api/auth/verify-forgot-otp?email=${email}`);
  } catch (error) {
    return res.status(500).json({message: error.message});
  }
};

// Resend Forgot OTP
const resendForgotOtp = async (req, res) => {
  try {
    const {email} = req.body;

    if (!email) {
      req.session.error = "Email is required";
      return res.redirect("/api/auth/forgot-password");
    }

    const user = await User.findOne({email});

    if (!user) {
      req.session.error = "User not found";
      return res.redirect("/api/auth/forgot-password");
    }

    if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt < 30 * 1000) {
      req.session.error = "Please wait before resending OTP";
      return res.redirect(`/api/auth/verify-forgot-otp?email=${email}`);
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.otp = otp;
    user.otpExpiry = Date.now() + 90 * 1000;
    user.lastOtpSentAt = Date.now();

    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Resend Forgot Password OTP",
      text: `Your OTP is ${otp}`,
    });

    req.session.success = "OTP resent successfully";

    return res.redirect(`/api/auth/verify-forgot-otp?email=${email}`);
  } catch (error) {
    return res.status(500).json({message: error.message});
  }
};

// Verify Forgot OTP
const verifyForgotOtp = async (req, res) => {
  try {
    const {email, otp} = req.body;

    const user = await User.findOne({email});

    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    if (String(user.otp) !== String(otp)) {
      req.session.error = "Invalid Otp";
      return res.redirect("/api/auth/verify-forgot-otp?email=" + email);
    }

    if (user.otpExpiry < Date.now()) {
      req.session.error = "OTP expired";
      return res.redirect("/api/auth/verify-forgot-otp?email=" + email);
    }

    return res.redirect(`/api/auth/reset-password?email=${email}`);
  } catch (error) {
    return res.status(500).json({message: error.message});
  }
};

// Login
const login = async (req, res) => {
  try {
    const {email, password} = req.body;

    console.log("LOGIN HIT");
    console.log("SESSION BEFORE:", req.session);

    const user = await User.findOne({email});

    if (!user) {
      req.session.error = "User not found";
      return res.redirect("/api/auth/login");
    }

    if (user.status === "blocked") {
      req.session.error = "You are blocked by admin";
      return res.redirect("/api/auth/login");
    }

    if (!user.password) {
      req.session.error = "Please login with Google";
      return res.redirect("/api/auth/login");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      req.session.error = "Invalid password";
      return res.redirect("/api/auth/login");
    }

    delete req.session.adminId;

    req.session.userId = user._id;

    console.log("SESSION AFTER:", req.session);

    return res.redirect("/home");
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    req.session.error = "Something went wrong";
    return res.redirect("/api/auth/login");
  }
};

// Reset Password

const resetPassword = async (req, res) => {
  try {
    const {email, newPassword, confirmPassword} = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({message: "All fields required"});
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({message: "Passwords do not match"});
    }

    const user = await User.findOne({email});

    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;

    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return res.redirect("/api/auth/login");
  } catch (error) {
    return res.status(500).json({
      message: "Error resetting password",
      error: error.message,
    });
  }
};

function handleError(req, res, isAjax, message) {
  if (isAjax) {
    return res.status(400).json({message});
  }

  req.session.error = message;
  return res.redirect("/api/auth/login");
}

module.exports = {
  signup,
  resendOtp,
  verifyOtp,
  login,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
  resendForgotOtp,
};
