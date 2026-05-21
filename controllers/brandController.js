const brandService = require("../services/brandService");

// Add brand
exports.addBrand = async (req, res) => {
  try {
    const {name, description} = req.body;
    const logoPath = req.file ? `/brandUploads/${req.file.filename}` : "";

    await brandService.createBrand({name, description, logoPath});

    res.status(201).json({message: "Brand added successfully"});
  } catch (err) {
    if (err.message === "Brand already exists") {
      return res.status(400).json({message: err.message});
    }
    res.status(500).json({message: err.message});
  }
};

// Read brand
exports.getBrand = async (req, res) => {
  try {
    const brands = await brandService.getAllBrands();
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

    const logoPath = req.file
      ? `/brandUploads/${req.file.filename}`
      : undefined;

    const updatedBrand = await brandService.updateBrandById(id, {
      name,
      description,
      logoPath,
    });

    if (!updatedBrand) {
      return res.status(404).json({message: "Brand not found"});
    }

    res.json({message: "Brand updated successfully"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// toggle
exports.toggleBrandStatus = async (req, res) => {
  try {
    const {id} = req.params;
    const brand = await brandService.toggleBrandListing(id);

    if (!brand) {
      return res.status(404).json({message: "Brand not found"});
    }

    res.json({
      message: brand.isListed ? "Brand listed" : "Brand unlisted",
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};
