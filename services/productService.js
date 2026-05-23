const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const fs = require("fs");
const path = require("path");

exports.getPaginatedProducts = async (queryParams) => {
  let {search = "", page = 1, limit = 10} = queryParams;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  let filter = {};

  if (search && search.trim() !== "") {
    const regex = new RegExp(search.trim(), "i");

    const [categories, brands] = await Promise.all([
      Category.find({name: {$regex: regex}}),
      Brand.find({name: {$regex: regex}}),
    ]);

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

  return {
    products,
    currentPage: page,
    totalPages,
  };
};

exports.createProduct = async (productData, files) => {
  const {name, description, category, brand} = productData;
  let variants = JSON.parse(productData.variants || "[]");

  let fileIndex = 0;
  variants = variants.map((variant) => {
    const imageCount = variant.images ? variant.images.length : 0;
    const images = [];

    for (let i = 0; i < imageCount; i++) {
      if (files && files[fileIndex]) {
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

  return await product.save();
};

exports.getProductById = async (id) => {
  return await Product.findById(id).populate("category").populate("brand");
};

exports.updateProductById = async (id, updateData, files, rootDir) => {
  const product = await Product.findById(id);
  if (!product) return null;

  let variants = JSON.parse(updateData.variants || "[]");
  const uploadedImages = files
    ? files.map((file) => `/productUploads/${file.filename}`)
    : [];

  let uploadIndex = 0;
  let oldImages = [];

  product.variants.forEach((v) => {
    oldImages.push(...v.images);
  });

  let newImagesUsed = [];

  variants = variants.map((v) => {
    let images = [];
    const variantImages = v.images || [];

    variantImages.forEach((img) => {
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
      const filePath = path.join(rootDir, "public", img);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Deleted unused image file:", img);
      }
    }
  });

  product.name = updateData.name;
  product.description = updateData.description;
  product.category = updateData.category;
  product.brand = updateData.brand;
  product.variants = variants;

  return await product.save();
};

exports.toggleListingStatus = async (id) => {
  const product = await Product.findById(id);
  if (!product) return null;

  product.isListed = !product.isListed;
  return await product.save();
};
