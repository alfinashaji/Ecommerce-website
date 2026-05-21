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

const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

const sendOtpEmail = async (email, otp, subjectType = "standard") => {
  const subject =
    subjectType === "forgot" ? "Forgot Password OTP" : "Your OTP Code";
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    text: `Your OTP is: ${otp}`,
  });
};

exports.registerUser = async ({fullName, email, password, referralCode}) => {
  const existingUser = await User.findOne({email});
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();

  await User.create({
    fullName,
    email,
    password: hashedPassword,
    referralCode: referralCode || "",
    isVerified: false,
    status: "inactive",
    otp,
    otpExpiry: Date.now() + 90 * 1000,
    lastOtpSentAt: Date.now(),
  });

  await sendOtpEmail(email, otp);
};

exports.getUserByEmail = async (email) => {
  return await User.findOne({email});
};

exports.refreshUserOtp = async (email, subjectType) => {
  const user = await User.findOne({email});
  if (!user) throw new Error("User not found");

  if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt < 30 * 1000) {
    throw new Error("Please wait before resending OTP");
  }

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = Date.now() + 90 * 1000;
  user.lastOtpSentAt = Date.now();
  await user.save();

  await sendOtpEmail(email, otp, subjectType);
};

exports.verifyUserOtp = async (email, otp) => {
  const user = await User.findOne({email});
  if (!user) throw new Error("User not found");
  if (user.otpExpiry < Date.now()) throw new Error("OTP expired");
  if (String(user.otp) !== String(otp)) throw new Error("Invalid OTP");

  user.isVerified = true;
  user.status = "active";
  user.otp = null;
  user.otpExpiry = null;
  user.lastOtpSentAt = null;
  await user.save();
};

exports.authenticateUser = async (email, password) => {
  const user = await User.findOne({email});
  if (!user) throw new Error("User not found");
  if (!user.isVerified) throw new Error("Please verify OTP first");
  if (user.status === "blocked") throw new Error("You are blocked by admin");
  if (!user.password) throw new Error("Please login with Google");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid password");

  return user;
};

exports.initiatePasswordReset = async (email) => {
  const user = await User.findOne({email});
  if (!user) throw new Error("User not found");

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = Date.now() + 90 * 1000;
  user.lastOtpSentAt = Date.now();
  await user.save();

  await sendOtpEmail(email, otp, "forgot");
};

exports.verifyResetOtpOnly = async (email, otp) => {
  const user = await User.findOne({email});
  if (!user) throw new Error("User not found");
  if (user.otpExpiry < Date.now()) throw new Error("OTP expired");
  if (String(user.otp) !== String(otp)) throw new Error("Invalid OTP");
};

exports.finalizePasswordReset = async (email, newPassword) => {
  const user = await User.findOne({email});
  if (!user) throw new Error("User not found");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.otp = null;
  user.otpExpiry = null;
  user.lastOtpSentAt = null;
  await user.save();
};
