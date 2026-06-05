const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const {
  getDashboard,
  getUsers,
  toggleUserStatus,
  adminLogin,
  getOrders,
  getOrderDetails,
  approveReturn,
  updateOrderStatus,
} = require("../controllers/adminController");
const Category = require("../models/categoryModel");
const inventoryController = require("../controllers/inventoryController");

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

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/admin/dashboard");
    }

    res.clearCookie("connect.sid");
    res.redirect("/admin/login");
  });
});

router.get("/orders", adminAuth, getOrders);
router.get("/orders/:id", adminAuth, getOrderDetails);
router.post("/orders/:id/status", adminAuth, updateOrderStatus);
router.post(
  "/orders/:orderId/product/:productId/approve-return",
  adminAuth,
  approveReturn,
);

router.get("/inventory", adminAuth, inventoryController.getInventoryPage);
router.post(
  "/inventory/update/:productId/:variantId",
  adminAuth,
  inventoryController.updateVariantStock,
);

module.exports = router;
