const express = require("express");
const router = express.Router();

const {
  addCategory,
  getCategories,
  editCategory,
  toggleCategoryStatus,
} = require("../controllers/categoryController");

router.post("/add", addCategory);
router.get("/", getCategories);
router.put("/edit/:id", editCategory);
router.patch("/toggle/:id", toggleCategoryStatus);

module.exports = router;
