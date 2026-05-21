const productService = require("../services/productService");
const path = require("path");

// get all products
exports.getProducts = async (req, res) => {
  try {
    const result = await productService.getPaginatedProducts(req.query);
    res.json(result);
  } catch (err) {
    console.error("Product Fetch Error:", err);
    res.status(500).json({message: err.message});
  }
};

// add product
exports.addProduct = async (req, res) => {
  try {
    await productService.createProduct(req.body, req.files);
    res.status(201).json({message: "Product added successfully"});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: err.message});
  }
};

// get single product
exports.getSingleProduct = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({message: "Product not found"});
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// edit product
exports.editProduct = async (req, res) => {
  try {
    const {id} = req.params;
    const rootDir = path.join(__dirname, "..");

    const updatedProduct = await productService.updateProductById(
      id,
      req.body,
      req.files,
      rootDir,
    );

    if (!updatedProduct) {
      return res.status(404).json({message: "Product not found"});
    }

    res.json({message: "Product updated successfully"});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: err.message});
  }
};

// toggle
exports.toggleProductStatus = async (req, res) => {
  try {
    const {id} = req.params;
    const product = await productService.toggleListingStatus(id);

    if (!product) {
      return res.status(404).json({message: "Product not found"});
    }

    res.json({
      message: product.isListed ? "Product listed" : "Product unlisted",
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};
