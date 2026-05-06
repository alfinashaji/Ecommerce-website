const User = require("../models/userModel");

const adminAuth = async (req, res, next) => {
  try {
    if (!req.session.adminId) {
      return res.redirect("/admin/login");
    }

    const admin = await User.findById(req.session.adminId);

    if (!admin || admin.role !== "admin") {
      return req.session.destroy(() => {
        res.redirect("/admin/login");
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error(err);
    return req.session.destroy(() => {
      res.redirect("/admin/login");
    });
  }
};

module.exports = adminAuth;
