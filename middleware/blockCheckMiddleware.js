const User = require("../models/userModel");

const checkBlockStatus = async (req, res, next) => {
  try {
    if (req.path.startsWith("/admin")) {
      return next();
    }

    if (!req.session?.userId) {
      return next();
    }

    const user = await User.findById(req.session.userId);
    if (!user || user.status === "blocked") {
      console.log("BLOCKED USER KICKED:", user?.email);
      delete req.session.userId;

      res.set("Cache-Control", "no-store");
      return res.redirect("/api/auth/login");
    }

    next();
  } catch (err) {
    console.log("Block check middleware error:", err);
    next();
  }
};

module.exports = checkBlockStatus;
