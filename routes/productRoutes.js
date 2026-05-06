const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const uploadProduct = require("../middleware/uploadProduct");

const {
  addProduct,
  getProducts,
  toggleProductStatus,
  getSingleProduct,
  editProduct,
} = require("../controllers/productController");

// ADD PRODUCT
router.post(
  "/add",
  adminAuth,
  uploadProduct.array("variantImages"),
  addProduct,
);

router.get("/", adminAuth, getProducts);

router.get("/edit/:id", adminAuth, getSingleProduct);

router.put(
  "/edit/:id",
  adminAuth,
  uploadProduct.array("variantImages"),
  editProduct,
);

router.patch("/toggle/:id", adminAuth, toggleProductStatus);

module.exports = router;
