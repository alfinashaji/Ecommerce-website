const express = require("express");
const router = express.Router();
const passport = require("../config/passport");

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "consent select_account",
  }),
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect("/api/auth/login");

    req.logIn(user, (err) => {
      if (err) return next(err);

      // 🔥 ADD THIS
      req.session.userId = user._id;

      const redirectUrl = req.session.redirectUrl || "/home";
      req.session.redirectUrl = null;

      return res.redirect(redirectUrl);
    });
  })(req, res, next);
});

module.exports = router;
