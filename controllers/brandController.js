const Brand = require("../models/brandModel");

// Add brand
exports.addBrand = async (req, res) => {
  try {
    const {name, description} = req.body;

    const existing = await Brand.findOne({name});
    if (existing) {
      return res.status(400).json({message: "Brand already exists"});
    }

    const logo = req.file ? `/brandUploads/${req.file.filename}` : "";

    const brand = new Brand({
      name,
      description,
      logo,
    });

    await brand.save();

    res.status(201).json({message: "Brand added successfully"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// Read brand
exports.getBrand = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json(brands);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// edit brand
exports.editBrand = async (req, res) => {
  try {
    const {id} = req.params;
    const {name, description} = req.body;

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({message: "Brand not found"});
    }

    if (req.file) {
      brand.logo = `/brandUploads/${req.file.filename}`;
    }

    brand.name = name || brand.name;
    brand.description = description || brand.description;

    await brand.save();

    res.json({message: "Brand updated successfully"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// toggle
exports.toggleBrandStatus = async (req, res) => {
  try {
    const {id} = req.params;

    const brand = await Brand.findById(id); // ✅ FIXED

    if (!brand) {
      return res.status(404).json({message: "Brand not found"});
    }

    brand.isListed = !brand.isListed;

    await brand.save();

    res.json({
      message: brand.isListed ? "Brand listed" : "Brand unlisted",
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};
