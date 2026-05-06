const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

router.get("/", auth, profileController.getProfile);
router.patch("/", auth, profileController.updateProfile);

router.post("/verify-email-otp", auth, profileController.verifyEmailOtp);
router.post("/resend-email-otp", auth, profileController.resendEmailOtp);

router.patch("/change-password", auth, profileController.changePassword);

router.post("/forgot-password", auth, profileController.profileForgotPassword);
router.post("/verify-forgot-otp", auth, profileController.verifyForgotOtp);
router.post("/reset-password", auth, profileController.profileResetPassword);

module.exports = router;
