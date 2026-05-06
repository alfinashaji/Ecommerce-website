const express = require("express");
const router = express.Router();

const {
  getUserProducts,
  getProductDetails,
} = require("../controllers/userProductController");
const auth = require("../middleware/authMiddleware");

// API
router.get("/api", auth, getUserProducts);
router.get("/:id", auth, getProductDetails);

// UI
router.get("/", auth, (req, res) => {
  res.render("pages/products");
});

module.exports = router;
