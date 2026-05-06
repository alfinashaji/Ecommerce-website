const express = require("express");
const router = express.Router();

const {
  getCategoryOffersPage,
  getCategoryOffer,
  saveCategoryOffer,
  toggleOfferStatus,
} = require("../controllers/categoryOfferController");

// PAGE
router.get("/", getCategoryOffersPage);

// GET SINGLE (EDIT)
router.get("/edit/:id", getCategoryOffer);

// SAVE (ADD + EDIT)
router.post("/save", saveCategoryOffer);

// TOGGLE ACTIVE / INACTIVE
router.post("/toggle", toggleOfferStatus);

module.exports = router;
