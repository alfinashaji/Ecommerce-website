const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const {getCategoryDiscountPrice} = require("../utils/discountHelper");

exports.universalSearch = async (req, res) => {
  try {
    const searchTerm = req.query.search || "";

    if (!searchTerm.trim()) {
      return res.redirect("/products");
    }

    // Find matching Categories and Brands
    const [matchedCategories, matchedBrands] = await Promise.all([
      Category.find({
        name: {$regex: searchTerm, $options: "i"},
        isDeleted: false,
      }),
      Brand.find({
        name: {$regex: searchTerm, $options: "i"},
        isListed: true,
      }),
    ]);

    const categoryIds = matchedCategories.map((c) => c._id);
    const brandIds = matchedBrands.map((b) => b._id);

    //Product Filter
    const filter = {
      isListed: true,
      $or: [
        {name: {$regex: searchTerm, $options: "i"}},
        {description: {$regex: searchTerm, $options: "i"}},
        {category: {$in: categoryIds}},
        {brand: {$in: brandIds}},
      ],
    };

    // serach products
    let products = await Product.find(filter)
      .populate("category")
      .populate("brand");

    products = products.filter(
      (p) => p.category && !p.category.isDeleted && p.brand && p.brand.isListed,
    );

    const updatedProducts = products.map((product) => {
      const updatedVariants = product.variants.map((v) => {
        const finalPrice = getCategoryDiscountPrice(v.price, product.category);
        return {
          ...v.toObject(),
          finalPrice,
        };
      });

      return {
        ...product.toObject(),
        variants: updatedVariants,
      };
    });

    return res.redirect(`/products?search=${encodeURIComponent(searchTerm)}`);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).redirect("/products");
  }
};
