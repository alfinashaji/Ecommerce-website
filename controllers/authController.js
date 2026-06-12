const authService = require("../services/authService");

//Signup
const signup = async (req, res) => {
  try {
    await authService.registerUser(req.body);

    req.session.userData = {
      fullName: req.body.fullName,
      email: req.body.email,
    };

    return res.redirect("/api/auth/verify-otp");
  } catch (error) {
    console.error(error);
    req.session.error = error.message;
    return res.redirect("/api/auth/signup");
  }
};

//Get verify otp page
const getVerifyOtpPage = async (req, res) => {
  try {
    if (!req.session.userData) {
      return res.redirect("/api/auth/signup");
    }

    const email = req.session.userData.email;
    const user = await authService.getUserByEmail(email);

    res.render("auth/otp", {
      email,
      otpExpiry: user?.otpExpiry || 0,
      error: req.session.error,
      success: req.session.success,
    });

    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    return res.redirect("/api/auth/signup");
  }
};

// Resend OTP
const resendOtp = async (req, res) => {
  try {
    await authService.refreshUserOtp(req.body.email, "standard");
    req.session.success = "OTP resent successfully";
    return res.redirect("/api/auth/verify-otp");
  } catch (error) {
    console.error(error);
    req.session.error = error.message;
    return res.redirect("/api/auth/verify-otp");
  }
};

//Verify OTP
const verifyOtp = async (req, res) => {
  try {
    if (!req.session.userData) {
      req.session.error = "Session expired";
      return res.redirect("/api/auth/signup");
    }

    await authService.verifyUserOtp(req.session.userData.email, req.body.otp);

    req.session.success = "Signup successful. Please login";
    delete req.session.userData;

    return res.redirect("/api/auth/login");
  } catch (error) {
    req.session.error = error.message;
    return res.redirect("/api/auth/verify-otp");
  }
};

//login
const login = async (req, res) => {
  try {
    const {email, password} = req.body;
    const user = await authService.authenticateUser(email, password);

    // delete req.session.adminId;
    req.session.userId = user._id;

    return res.redirect("/home");
  } catch (error) {
    console.error(error);
    req.session.error = error.message;
    return res.redirect("/api/auth/login");
  }
};

//Forgot password
const forgotPassword = async (req, res) => {
  try {
    await authService.initiatePasswordReset(req.body.email);
    req.session.forgotEmail = req.body.email;
    return res.redirect("/api/auth/verify-forgot-otp");
  } catch (error) {
    req.session.error = error.message;
    return res.redirect("/api/auth/forgot-password");
  }
};

//Get forgot otp page
const getForgotOtpPage = async (req, res) => {
  try {
    const email = req.session.forgotEmail;
    if (!email) {
      return res.redirect("/api/auth/forgot-password");
    }

    const user = await authService.getUserByEmail(email);

    res.render("auth/forgot-otp", {
      email,
      otpExpiry: user?.otpExpiry || 0,
      error: req.session.error,
      success: req.session.success,
    });

    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    return res.redirect("/api/auth/forgot-password");
  }
};

// Resend forgot otp
const resendForgotOtp = async (req, res) => {
  try {
    await authService.refreshUserOtp(req.body.email, "forgot");
    req.session.success = "OTP resent successfully";
    return res.redirect("/api/auth/verify-forgot-otp");
  } catch (error) {
    req.session.error = error.message;
    return res.redirect("/api/auth/verify-forgot-otp");
  }
};

// Verify forgot OTP
const verifyForgotOtp = async (req, res) => {
  try {
    await authService.verifyResetOtpOnly(req.body.email, req.body.otp);
    req.session.resetEmail = req.body.email;
    return res.redirect("/api/auth/reset-password");
  } catch (error) {
    req.session.error = error.message;
    return res.redirect("/api/auth/verify-forgot-otp");
  }
};

//Reset Password
const resetPassword = async (req, res) => {
  try {
    const {newPassword, confirmPassword} = req.body;
    const email = req.session.resetEmail;

    if (!email) {
      req.session.error = "Unauthorized access";
      return res.redirect("/api/auth/forgot-password");
    }

    if (!newPassword || !confirmPassword) {
      req.session.error = "All fields required";
      return res.redirect("/api/auth/reset-password");
    }

    if (newPassword !== confirmPassword) {
      req.session.error = "Passwords do not match";
      return res.redirect("/api/auth/reset-password");
    }

    await authService.finalizePasswordReset(email, newPassword);

    delete req.session.resetEmail;
    delete req.session.forgotEmail;

    req.session.success = "Password reset successful";
    return res.redirect("/api/auth/login");
  } catch (error) {
    req.session.error = error.message;
    return res.redirect("/api/auth/reset-password");
  }
};

module.exports = {
  signup,
  resendOtp,
  verifyOtp,
  login,
  forgotPassword,
  resendForgotOtp,
  verifyForgotOtp,
  resetPassword,
  getVerifyOtpPage,
  getForgotOtpPage,
};
