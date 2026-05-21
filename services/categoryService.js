const Category = require("../models/categoryModel");

exports.createCategory = async ({name, description}) => {
  const existing = await Category.findOne({
    name: {$regex: new RegExp(`^${name}$`, "i")},
  });

  if (existing) {
    throw new Error("Category already exists");
  }

  const category = new Category({name, description});
  return await category.save();
};

exports.getPaginatedCategories = async (queryParams) => {
  let {search = "", page = 1, limit = 10} = queryParams;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  let filter = {};
  if (search) {
    filter.name = {$regex: search, $options: "i"};
  }

  const totalCategories = await Category.countDocuments(filter);
  const categories = await Category.find(filter)
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalCategories / limit);

  return {
    categories,
    currentPage: page,
    totalPages,
  };
};

exports.updateCategoryById = async (id, {name, description}) => {
  if (name) {
    const existing = await Category.findOne({
      _id: {$ne: id},
      name: {$regex: new RegExp(`^${name}$`, "i")},
    });

    if (existing) {
      throw new Error("Category already exists");
    }
  }

  const category = await Category.findById(id);
  if (!category || category.isDeleted) {
    return null;
  }

  category.name = name || category.name;
  category.description = description || category.description;

  return await category.save();
};

exports.toggleCategoryDeletedStatus = async (id) => {
  const category = await Category.findById(id);
  if (!category) return null;

  category.isDeleted = !category.isDeleted;
  await category.save();

  return category;
};
