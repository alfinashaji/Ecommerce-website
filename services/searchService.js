const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const {getCategoryDiscountPrice} = require("../utils/discountHelper");

exports.executeUniversalSearch = async (searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) {
    return [];
  }

  const regexQuery = {$regex: searchTerm.trim(), $options: "i"};

  const [matchedCategories, matchedBrands] = await Promise.all([
    Category.find({name: regexQuery, isDeleted: false}),
    Brand.find({name: regexQuery, isListed: true}),
  ]);

  const categoryIds = matchedCategories.map((c) => c._id);
  const brandIds = matchedBrands.map((b) => b._id);

  const filter = {
    isListed: true,
    $or: [
      {name: regexQuery},
      {description: regexQuery},
      {category: {$in: categoryIds}},
      {brand: {$in: brandIds}},
    ],
  };

  const products = await Product.find(filter)
    .populate("category")
    .populate("brand");

  const activeProducts = products.filter(
    (p) => p.category && !p.category.isDeleted && p.brand && p.brand.isListed,
  );

  return activeProducts.map((product) => {
    const productObj = product.toObject();

    const updatedVariants = productObj.variants.map((v) => {
      const finalPrice = getCategoryDiscountPrice(v.price, productObj.category);
      return {
        ...v,
        finalPrice,
      };
    });

    return {
      ...productObj,
      variants: updatedVariants,
    };
  });
};
