const express = require("express");
const router = express.Router();
const User = require("../models/userModel");

const {
  signup,
  resendOtp,
  verifyOtp,
  login,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
  resendForgotOtp,
  getVerifyOtpPage,
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/resend-forgot-otp", resendForgotOtp);
router.post("/verify-forgot-otp", verifyForgotOtp);
router.post("/reset-password", resetPassword);

// SIGNUP PAGE
router.get("/signup", (req, res) => {
  const error = req.session.error;
  req.session.error = null;

  res.render("auth/signup", {error: error || null});
});

//VERIFY OTP PAGE
router.get("/verify-otp", getVerifyOtpPage);

// FORGOT PASSWORD PAGE
router.get("/forgot-password", (req, res) => {
  const error = req.session.error;
  req.session.error = null;

  res.render("auth/forgot-password", {error: error || null});
});

// VERIFY FORGOT OTP PAGE
router.get("/verify-forgot-otp", async (req, res) => {
  try {
    const email = req.session.forgotEmail;

    if (!email) {
      req.session.error = "Session expired";

      return res.redirect("/api/auth/forgot-password");
    }

    const error = req.session.error;
    const success = req.session.success;

    req.session.error = null;
    req.session.success = null;

    const user = await User.findOne({email});

    res.render("auth/forgot-otp", {
      email,
      error: error || null,
      success: success || null,
      otpExpiry: user?.otpExpiry ? Number(user.otpExpiry) : 0,
    });
  } catch (err) {
    console.log(err);

    res.redirect("/api/auth/forgot-password");
  }
});

//RESET PASSWORD PAGE
router.get("/reset-password", (req, res) => {
  if (!req.session.resetEmail) {
    req.session.error = "Unauthorized access";

    return res.redirect("/api/auth/forgot-password");
  }

  res.render("auth/reset-password", {
    error: req.session.error,
    success: req.session.success,
  });

  req.session.error = null;
  req.session.success = null;
});

//LOGIN PAGE
router.get("/login", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/home");
  }

  const error = req.session.error;
  const success = req.session.success;

  req.session.error = null;
  req.session.success = null;

  res.render("auth/login", {
    error: error || null,
    success: success || null,
  });
});

// LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.set("Cache-Control", "no-store"); // prevent back button access
    res.redirect("/api/auth/login");
  });
});

module.exports = router;
