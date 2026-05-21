const categoryOfferService = require("../services/addressService"); // Adjust paths based on your setup
const offerService = require("../services/categoryOfferService");

// get categories
exports.getCategoryOffersPage = async (req, res) => {
  try {
    const categories = await offerService.getAllCategories();
    res.render("admin/categoryOffer", {categories});
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

// get single category for edit
exports.getCategoryOffer = async (req, res) => {
  try {
    const discount = await offerService.getDiscountByCategoryId(req.params.id);

    if (!discount) {
      return res.status(404).json({message: "Not found"});
    }

    res.json(discount);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// add or edit category
exports.saveCategoryOffer = async (req, res) => {
  try {
    const {categoryId, type, value, expiryDate, isActive} = req.body;

    const discount = await offerService.saveDiscountOffer(categoryId, {
      type,
      value,
      expiryDate,
      isActive,
    });

    if (!discount) {
      return res.status(404).json({message: "Category not found"});
    }

    console.log("OFFER SAVED:", discount);
    res.json({message: "Offer saved"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// toggle
exports.toggleOfferStatus = async (req, res) => {
  try {
    const discount = await offerService.toggleDiscountStatus(
      req.body.categoryId,
    );

    if (!discount) {
      return res.status(404).json({message: "Not found"});
    }

    res.json({
      message: discount.isActive ? "Offer Activated" : "Offer Deactivated",
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};
