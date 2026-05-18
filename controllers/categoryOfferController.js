const Category = require("../models/categoryModel");

// get categories
exports.getCategoryOffersPage = async (req, res) => {
  const categories = await Category.find();
  res.render("admin/categoryOffer", {categories});
};

// get sigle category for edit
exports.getCategoryOffer = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({message: "Not found"});
    }

    res.json(category.discount);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// add or edit category
exports.saveCategoryOffer = async (req, res) => {
  try {
    const {categoryId, type, value, expiryDate, isActive} = req.body;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({message: "Category not found"});
    }

    category.discount.type = type;
    category.discount.value = Number(value);
    category.discount.expiryDate = new Date(expiryDate);

    // IMPORTANT
    category.discount.isActive = isActive === true || isActive === "true";

    category.markModified("discount");

    await category.save();

    console.log(category.discount);

    res.json({message: "Offer saved"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// toggle
exports.toggleOfferStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.body.categoryId);

    if (!category) {
      return res.status(404).json({message: "Not found"});
    }

    category.discount.isActive = !category.discount.isActive;

    category.markModified("discount");

    await category.save();

    res.json({
      message: category.discount.isActive
        ? "Offer Activated"
        : "Offer Deactivated",
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};
