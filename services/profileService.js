const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const OTP_VALIDITY = 90 * 1000;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendEmailNotification = async (to, subject, text) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
};

exports.updateProfileNameOnly = async (userId, fullName) => {
  const user = await User.findById(userId);
  if (!user) return null;

  user.fullName = fullName;
  await user.save();
  return {requireOtp: false};
};

exports.isEmailTakenByAnotherUser = async (userId, targetEmail) => {
  const existingUser = await User.findOne({
    email: targetEmail,
    _id: {$ne: userId},
  });
  return !!existingUser;
};

exports.initiateEmailUpdateVerification = async (userId, newEmail) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const otp = generateOtp();
  user.pendingEmail = newEmail;
  user.emailOtp = otp;
  user.emailOtpExpiry = Date.now() + OTP_VALIDITY;

  await user.save();
  await sendEmailNotification(
    newEmail,
    "Verify your new email",
    `Your OTP is ${otp}`,
  );

  return {requireOtp: true, expiry: 90};
};

exports.executeEmailUpdateConfirmation = async (userId, incomingOtp) => {
  const user = await User.findById(userId);
  if (!user) return {status: 404, message: "User not found"};

  if (!user.emailOtp || user.emailOtp !== incomingOtp) {
    return {status: 400, message: "Invalid OTP"};
  }

  if (!user.emailOtpExpiry || user.emailOtpExpiry < Date.now()) {
    return {status: 400, message: "OTP expired"};
  }

  user.email = user.pendingEmail;
  user.pendingEmail = null;
  user.emailOtp = null;
  user.emailOtpExpiry = null;

  await user.save();
  return {status: 200, message: "Email updated successfully"};
};

exports.retryEmailUpdateOtp = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return {status: 404, message: "User not found"};

  if (user.emailOtpExpiry && user.emailOtpExpiry > Date.now()) {
    return {status: 400, message: "Please wait until OTP expires"};
  }

  const otp = generateOtp();
  user.emailOtp = otp;
  user.emailOtpExpiry = Date.now() + OTP_VALIDITY;

  await user.save();

  const activeTargetEmail = user.pendingEmail || user.email;
  await sendEmailNotification(
    activeTargetEmail,
    "Resend OTP",
    `Your OTP is ${otp}`,
  );

  return {status: 200, expiry: 90};
};

exports.modifyUserPasswordSecurely = async (
  userId,
  currentPassword,
  newPassword,
) => {
  const user = await User.findById(userId);
  if (!user) return {status: 404, message: "User not found"};

  if (!user.password) {
    return {status: 400, message: "Please login with Google"};
  }

  const matchesCurrent = await bcrypt.compare(currentPassword, user.password);
  if (!matchesCurrent) {
    return {status: 400, message: "Incorrect current password"};
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return {status: 200};
};

exports.issueForgotPasswordOtpRequest = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = Date.now() + OTP_VALIDITY;

  await user.save();
  await sendEmailNotification(
    user.email,
    "Forgot Password OTP",
    `Your OTP is ${otp}`,
  );

  return {expiry: 90};
};

exports.validateForgotPasswordOtpToken = async (userId, incomingOtp) => {
  const user = await User.findById(userId);
  if (!user) return {status: 404, message: "User not found"};

  if (!user.otp || user.otp !== incomingOtp) {
    return {status: 400, message: "Invalid OTP"};
  }

  if (!user.otpExpiry || user.otpExpiry < Date.now()) {
    return {status: 400, message: "OTP expired"};
  }

  return {status: 200, message: "OTP verified"};
};

exports.executeSecurePasswordResetOverride = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user) return {status: 404, message: "User not found"};

  if (!user.otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
    return {status: 400, message: "OTP invalid or expired"};
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = null;
  user.otpExpiry = null;

  await user.save();
  return {status: 200, message: "Password reset successful"};
};
