const Product = require("../models/productModel");
const fs = require("fs");
const path = require("path");

// get all products
exports.getProducts = async (req, res) => {
  try {
    let {search = "", page = 1, limit = 10} = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {};

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");

      const Category = require("../models/categoryModel");
      const Brand = require("../models/brandModel");

      const categories = await Category.find({name: {$regex: regex}});
      const brands = await Brand.find({name: {$regex: regex}});

      const categoryIds = categories.map((c) => c._id);
      const brandIds = brands.map((b) => b._id);

      filter.$or = [
        {name: {$regex: regex}},
        {description: {$regex: regex}},
        {category: {$in: categoryIds}},
        {brand: {$in: brandIds}},
      ];
    }

    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("brand", "name")
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error("Product Fetch Error:", err);
    res.status(500).json({message: err.message});
  }
};
//add product
exports.addProduct = async (req, res) => {
  try {
    const {name, description, category, brand} = req.body;
    let variants = JSON.parse(req.body.variants);
    const files = req.files;
    let fileIndex = 0;

    variants = variants.map((variant) => {
      const imageCount = variant.images.length;
      const images = [];

      for (let i = 0; i < imageCount; i++) {
        if (files[fileIndex]) {
          images.push(`/productUploads/${files[fileIndex].filename}`);
          fileIndex++;
        }
      }

      return {
        ...variant,
        images,
      };
    });

    const product = new Product({
      name,
      description,
      category,
      brand,
      variants,
    });

    await product.save();
    res.status(201).json({message: "Product added successfully"});
  } catch (err) {
    console.log(err);
    res.status(500).json({message: err.message});
  }
};

//get single product
exports.getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("brand");

    if (!product) {
      return res.status(404).json({message: "Product not found"});
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

//edit product
exports.editProduct = async (req, res) => {
  try {
    const {id} = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({message: "Product not found"});
    }

    let variants = JSON.parse(req.body.variants || "[]");
    const uploadedImages = req.files.map(
      (file) => `/productUploads/${file.filename}`,
    );

    let uploadIndex = 0;

    let oldImages = [];
    product.variants.forEach((v) => {
      oldImages.push(...v.images);
    });

    let newImagesUsed = [];

    variants = variants.map((v) => {
      let images = [];

      v.images.forEach((img) => {
        if (img === "temp") {
          const newImg = uploadedImages[uploadIndex++];
          images.push(newImg);
          newImagesUsed.push(newImg);
        } else {
          images.push(img);
          newImagesUsed.push(img);
        }
      });

      return {
        size: v.size,
        color: v.color,
        price: v.price,
        stock: v.stock,
        images,
      };
    });

    oldImages.forEach((img) => {
      if (!newImagesUsed.includes(img)) {
        const filePath = path.join(__dirname, "..", "public", img);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Deleted unused image:", img);
        }
      }
    });

    product.name = req.body.name;
    product.description = req.body.description;
    product.category = req.body.category;
    product.brand = req.body.brand;
    product.variants = variants;

    await product.save();
    res.json({message: "Product updated successfully"});
  } catch (err) {
    console.log(err);
    res.status(500).json({message: err.message});
  }
};

// toggle
exports.toggleProductStatus = async (req, res) => {
  try {
    const {id} = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({message: "Product not found"});
    }

    product.isListed = !product.isListed;
    await product.save();

    res.json({
      message: product.isListed ? "Product listed" : "Product unlisted",
    });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};
