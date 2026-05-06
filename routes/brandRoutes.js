const express = require("express");
const router = express.Router();

const {
  addBrand,
  getBrand,
  editBrand,
  toggleBrandStatus,
} = require("../controllers/brandController");
const uploadBrand = require("../middleware/uploadBrand");
// ================= ROUTES =================

// Add brand
router.post("/add", uploadBrand.single("logo"), addBrand);

// Get all brands
router.get("/", getBrand);

// Edit brand
router.put("/edit/:id", uploadBrand.single("logo"), editBrand);

// Toggle (List / Unlist)
router.patch("/toggle/:id", toggleBrandStatus);

module.exports = router;
