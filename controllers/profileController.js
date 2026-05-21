const User = require("../models/userModel");
const profileService = require("../services/profileService");

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Get the profile
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect("/api/auth/login");
    }
    return res.render("pages/profile", {user});
  } catch (err) {
    console.error(err);
    return res.redirect("/api/auth/login");
  }
};

// profile controller validation
exports.updateProfile = async (req, res) => {
  try {
    let {fullName, email} = req.body;

    fullName = fullName?.trim();
    email = email?.trim().toLowerCase();

    if (!fullName || fullName.length < 3) {
      return res
        .status(400)
        .json({message: "Full name must contain at least 3 characters"});
    }
    if (fullName.length > 30) {
      return res
        .status(400)
        .json({message: "Full name cannot exceed 30 characters"});
    }
    if (!nameRegex.test(fullName)) {
      return res
        .status(400)
        .json({message: "Full name can contain only letters"});
    }
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({message: "Please enter a valid email address"});
    }
    if (email === req.user.email) {
      await profileService.updateProfileNameOnly(req.user._id, fullName);
      return res.json({message: "Profile updated", requireOtp: false});
    }

    const taken = await profileService.isEmailTakenByAnotherUser(
      req.user._id,
      email,
    );
    if (taken) {
      return res.status(400).json({message: "Email already in use"});
    }
    const verificationDetails =
      await profileService.initiateEmailUpdateVerification(req.user._id, email);
    req.user.fullName = fullName;

    return res.json({
      message: "OTP sent to new email",
      requireOtp: verificationDetails.requireOtp,
      expiry: verificationDetails.expiry,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: "Internal server error"});
  }
};

// Verify email otp
exports.verifyEmailOtp = async (req, res) => {
  try {
    const {otp} = req.body;
    const outcome = await profileService.executeEmailUpdateConfirmation(
      req.user._id,
      otp,
    );

    if (outcome.status !== 200) {
      return res.status(outcome.status).json({message: outcome.message});
    }

    res.json({message: outcome.message});
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

// Resend email otp
exports.resendEmailOtp = async (req, res) => {
  try {
    const outcome = await profileService.retryEmailUpdateOtp(req.user._id);

    if (outcome.status !== 200) {
      return res.status(outcome.status).json({message: outcome.message});
    }

    res.json({message: "OTP resent", expiry: outcome.expiry});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// change password
exports.changePassword = async (req, res) => {
  try {
    const {currentPassword, newPassword, confirmPassword} = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({message: "All fields are required"});
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({message: "Passwords do not match"});
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({message: "Password must contain at least 8 characters"});
    }
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must contain uppercase, lowercase, number and special character",
      });
    }
    if (currentPassword === newPassword) {
      return res
        .status(400)
        .json({message: "New password cannot be same as current password"});
    }

    const outcome = await profileService.modifyUserPasswordSecurely(
      req.user._id,
      currentPassword,
      newPassword,
    );

    if (outcome.status !== 200) {
      return res.status(outcome.status).json({message: outcome.message});
    }

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
    const trackingInfo = await profileService.issueForgotPasswordOtpRequest(
      req.user._id,
    );
    if (!trackingInfo) {
      return res.status(404).json({message: "User not found"});
    }
    res.json({message: "OTP sent", expiry: trackingInfo.expiry});
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

// verify forgot otp
exports.verifyForgotOtp = async (req, res) => {
  try {
    const {otp} = req.body;
    const outcome = await profileService.validateForgotPasswordOtpToken(
      req.user._id,
      otp,
    );

    return res.status(outcome.status).json({message: outcome.message});
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

// reset password
exports.profileResetPassword = async (req, res) => {
  try {
    const {newPassword, confirmPassword} = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({message: "All fields are required"});
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({message: "Passwords do not match"});
    }
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must contain uppercase, lowercase, number and special character",
      });
    }

    const outcome = await profileService.executeSecurePasswordResetOverride(
      req.user._id,
      newPassword,
    );
    return res.status(outcome.status).json({message: outcome.message});
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};
