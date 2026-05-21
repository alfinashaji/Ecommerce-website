const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const {getCategoryDiscountPrice} = require("../utils/discountHelper");

const mapProductDiscounts = (products) => {
  return products.map((product) => {
    const productObj = product.toObject();
    const updatedVariants = productObj.variants.map((v) => ({
      ...v,
      finalPrice: getCategoryDiscountPrice(v.price, productObj.category),
    }));

    return {
      ...productObj,
      variants: updatedVariants,
    };
  });
};

exports.getFilteredUserProducts = async (queryParams) => {
  const {
    page = 1,
    search = "",
    sort = "",
    category = "",
    size = "",
    brand = "",
    priceMin,
    priceMax,
  } = queryParams;

  const limit = 6;
  const skip = (Number(page) - 1) * limit;
  let filter = {isListed: true};

  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (size) filter["variants.size"] = size;

  if (search) {
    const regexQuery = {$regex: search, $options: "i"};
    const [categories, brands] = await Promise.all([
      Category.find({name: regexQuery}),
      Brand.find({name: regexQuery}),
    ]);

    filter.$or = [
      {name: regexQuery},
      {description: regexQuery},
      {category: {$in: categories.map((c) => c._id)}},
      {brand: {$in: brands.map((b) => b._id)}},
    ];
  }

  const dbProducts = await Product.find(filter)
    .populate("category", "name discount isDeleted")
    .populate("brand", "name logo isListed");

  const activeProducts = dbProducts.filter(
    (p) =>
      p.category &&
      p.brand &&
      p.brand.isListed &&
      p.category.isDeleted === false,
  );

  let processedProducts = mapProductDiscounts(activeProducts);

  if (priceMin || priceMax) {
    processedProducts = processedProducts.filter((product) =>
      product.variants.some((v) => {
        const price = v.finalPrice;
        return (
          (!priceMin || price >= Number(priceMin)) &&
          (!priceMax || price <= Number(priceMax))
        );
      }),
    );
  }

  if (sort === "priceLow") {
    processedProducts.sort(
      (a, b) =>
        Math.min(...a.variants.map((v) => v.finalPrice)) -
        Math.min(...b.variants.map((v) => v.finalPrice)),
    );
  } else if (sort === "priceHigh") {
    processedProducts.sort(
      (a, b) =>
        Math.min(...b.variants.map((v) => v.finalPrice)) -
        Math.min(...a.variants.map((v) => v.finalPrice)),
    );
  } else if (sort === "a-z") {
    processedProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "z-a") {
    processedProducts.sort((a, b) => b.name.localeCompare(a.name));
  }

  const total = processedProducts.length;
  const paginatedProducts = processedProducts.slice(skip, skip + limit);

  return {
    products: paginatedProducts,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
  };
};
exports.getProductDetailBundle = async (productId) => {
  const product = await Product.findById(productId)
    .populate("category", "name discount")
    .populate("brand", "name logo");

  if (!product || !product.isListed) return null;

  const productObj = product.toObject();
  productObj.variants = productObj.variants.map((v) => ({
    ...v,
    finalPrice: getCategoryDiscountPrice(v.price, productObj.category),
  }));

  const targetSizes = productObj.variants.map((v) => v.size);
  const targetColors = productObj.variants.map((v) => v.color);

  const rawRelated = await Product.find({
    isListed: true,
    _id: {$ne: productObj._id},
    category: productObj.category._id,
    $or: [
      {"variants.size": {$in: targetSizes}},
      {"variants.color": {$in: targetColors}},
    ],
  })
    .limit(4)
    .populate("category", "name discount");

  const processedRelated = mapProductDiscounts(rawRelated);

  return {
    product: productObj,
    relatedProducts: processedRelated,
  };
};

exports.getHomepageShowcaseProducts = async () => {
  const products = await Product.find({isListed: true})
    .populate("category", "name discount isDeleted")
    .populate("brand", "name logo isListed")
    .limit(12);

  const activeProducts = products.filter(
    (p) =>
      p.category &&
      p.brand &&
      p.brand.isListed &&
      p.category.isDeleted === false,
  );

  return mapProductDiscounts(activeProducts);
};
