const Category = require("../models/categoryModel");

// category add

exports.addCategory = async (req, res) => {
  try {
    const {name, description} = req.body;
    const existing = await Category.findOne({name});

    if (existing) {
      return res.status(401).json({message: "Category already exists"});
    }
    const category = new Category({
      name,
      description,
    });
    await category.save();
    res.status(201).json({message: "Category added successfully"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

exports.getCategories = async (req, res) => {
  try {
    let {search = "", page = 1, limit = 10} = req.query;
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

    res.json({
      categories,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// edit category

exports.editCategory = async (req, res) => {
  try {
    const {id} = req.params;
    const {name, description} = req.body;

    const category = await Category.findById(id);

    if (!category || category.isDeleted) {
      return res.status(404).json({message: "Category not found"});
    }

    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();

    res.json({message: "Category updated successfully"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// delete category

exports.toggleCategoryStatus = async (req, res) => {
  try {
    const {id} = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({message: "Category not found"});
    }

    // toggle
    category.isDeleted = !category.isDeleted;

    await category.save();

    res.json({
      message: category.isDeleted ? "Category unlisted" : "Category listed",
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};
