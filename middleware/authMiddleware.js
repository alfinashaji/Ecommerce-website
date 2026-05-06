const User = require("../models/userModel");
const auth = async (req, res, next) => {
  try {
    if (!req.session?.userId) {
      return res.redirect("/api/auth/login");
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      return req.session.destroy(() => {
        res.redirect("/api/auth/login");
      });
    }

    //block check
    if (user.status === "blocked") {
      console.log("BLOCKED USER KICKED:", user.email);

      return req.session.destroy(() => {
        res.redirect("/api/auth/login");
      });
    }

    req.user = user;
    res.locals.user = user;

    next();
  } catch (err) {
    console.log("AUTH ERROR:", err);

    return req.session.destroy(() => {
      res.redirect("/api/auth/login");
    });
  }
};
module.exports = auth;
