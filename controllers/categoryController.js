const categoryService = require("../services/categoryService");

// category add
exports.addCategory = async (req, res) => {
  try {
    await categoryService.createCategory(req.body);
    res.status(201).json({message: "Category added successfully"});
  } catch (err) {
    if (err.message === "Category already exists") {
      return res.status(401).json({message: err.message});
    }
    res.status(500).json({message: err.message});
  }
};

// get all categories
exports.getCategories = async (req, res) => {
  try {
    const result = await categoryService.getPaginatedCategories(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// edit category
exports.editCategory = async (req, res) => {
  try {
    const {id} = req.params;
    const updatedCategory = await categoryService.updateCategoryById(
      id,
      req.body,
    );

    if (!updatedCategory) {
      return res.status(404).json({message: "Category not found"});
    }

    res.json({message: "Category updated successfully"});
  } catch (err) {
    if (err.message === "Category already exists") {
      return res.status(400).json({message: err.message});
    }
    res.status(500).json({message: err.message});
  }
};

// delete/toggle category
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const {id} = req.params;
    const category = await categoryService.toggleCategoryDeletedStatus(id);

    if (!category) {
      return res.status(404).json({message: "Category not found"});
    }

    res.json({
      message: category.isDeleted ? "Category unlisted" : "Category listed",
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};
