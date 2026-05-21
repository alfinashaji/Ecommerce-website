const express = require("express");
const router = express.Router();

const {
  getCategoryOffersPage,
  getCategoryOffer,
  saveCategoryOffer,
  toggleOfferStatus,
} = require("../controllers/categoryOfferController");

router.get("/", getCategoryOffersPage);

router.get("/edit/:id", getCategoryOffer);

router.post("/save", saveCategoryOffer);

router.post("/toggle", toggleOfferStatus);

module.exports = router;
