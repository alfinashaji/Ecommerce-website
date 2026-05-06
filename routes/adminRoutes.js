const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const {
  getDashboard,
  getUsers,
  toggleUserStatus,
  adminLogin,
} = require("../controllers/adminController");
const Category = require("../models/categoryModel");

// Dashboard
router.get("/dashboard", adminAuth, getDashboard);

// Users list
router.get("/users", adminAuth, getUsers);

// Block / Unblock user
router.patch("/users/:id/status", adminAuth, toggleUserStatus);

router.get("/login", (req, res) => {
  if (req.session.adminId) {
    return res.redirect("/admin/dashboard");
  }

  const error = req.session.error;
  req.session.error = null;

  res.render("admin/login", {error});
});

router.post("/login", adminLogin);

// categories

router.get("/categories", adminAuth, (req, res) => {
  res.render("admin/categories");
});

// brand

router.get("/brands", adminAuth, (req, res) => {
  res.render("admin/brands");
});

// products

router.get("/product", adminAuth, (req, res) => {
  res.render("admin/products");
});

// categoryOffer
router.get("/category-offers", async (req, res) => {
  const categories = await Category.find();
  res.render("admin/categoryOffer", {categories});
});
module.exports = router;
