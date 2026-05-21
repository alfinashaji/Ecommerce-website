const Category = require("../models/categoryModel");

exports.getAllCategories = async () => {
  return await Category.find();
};

exports.getDiscountByCategoryId = async (id) => {
  const category = await Category.findById(id);
  if (!category) return null;
  return category.discount;
};

exports.saveDiscountOffer = async (id, offerData) => {
  const {type, value, expiryDate, isActive} = offerData;
  const category = await Category.findById(id);
  if (!category) return null;

  category.discount.type = type;
  category.discount.value = Number(value);
  category.discount.expiryDate = new Date(expiryDate);

  category.discount.isActive = isActive === true || isActive === "true";

  category.markModified("discount");

  await category.save();
  return category.discount;
};

exports.toggleDiscountStatus = async (id) => {
  const category = await Category.findById(id);
  if (!category) return null;

  category.discount.isActive = !category.discount.isActive;

  category.markModified("discount");

  await category.save();
  return category.discount;
};
