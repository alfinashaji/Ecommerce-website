const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const Product = require("../models/productModel");
const {getCategoryDiscountPrice} = require("../utils/discountHelper");

//get all products
exports.getUserProducts = async (req, res) => {
  try {
    const {
      page = 1,
      search = "",
      sort = "",
      category = "",
      size = "",
      brand = "",
      priceMin,
      priceMax,
    } = req.query;

    const limit = 6;
    const skip = (Number(page) - 1) * limit;

    let filter = {isListed: true};

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (size) filter["variants.size"] = size;

    if (search) {
      const categories = await Category.find({
        name: {$regex: search, $options: "i"},
      });

      const brands = await Brand.find({
        name: {$regex: search, $options: "i"},
      });

      const categoryIds = categories.map((c) => c._id);
      const brandIds = brands.map((b) => b._id);

      filter.$or = [
        {name: {$regex: search, $options: "i"}},
        {description: {$regex: search, $options: "i"}},
        {category: {$in: categoryIds}},
        {brand: {$in: brandIds}},
      ];
    }

    let products = await Product.find(filter)
      .populate("category", "name discount isDeleted")
      .populate("brand", "name logo isListed");

    products = products.filter(
      (p) =>
        p.category &&
        p.brand &&
        p.brand.isListed &&
        p.category.isDeleted === false,
    );

    let finalProducts = products.map((product) => {
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

    if (priceMin || priceMax) {
      finalProducts = finalProducts.filter((product) => {
        return product.variants.some((v) => {
          const price = v.finalPrice;

          return (
            (!priceMin || price >= Number(priceMin)) &&
            (!priceMax || price <= Number(priceMax))
          );
        });
      });
    }

    if (sort === "priceLow") {
      finalProducts.sort(
        (a, b) =>
          Math.min(...a.variants.map((v) => v.finalPrice)) -
          Math.min(...b.variants.map((v) => v.finalPrice)),
      );
    }

    if (sort === "priceHigh") {
      finalProducts.sort(
        (a, b) =>
          Math.min(...b.variants.map((v) => v.finalPrice)) -
          Math.min(...a.variants.map((v) => v.finalPrice)),
      );
    }

    if (sort === "a-z") {
      finalProducts.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sort === "z-a") {
      finalProducts.sort((a, b) => b.name.localeCompare(a.name));
    }

    const total = finalProducts.length;
    const paginatedProducts = finalProducts.slice(skip, skip + limit);

    res.json({
      products: paginatedProducts,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({message: err.message});
  }
};

// get product
exports.getProductDetails = async (req, res) => {
  try {
    const {id} = req.params;

    const product = await Product.findById(id)
      .populate("category", "name discount")
      .populate("brand", "name logo");

    if (!product || !product.isListed) {
      return res.redirect("/products");
    }

    product.variants = product.variants.map((v) => {
      const finalPrice = getCategoryDiscountPrice(v.price, product.category);
      return {
        ...v.toObject(),
        finalPrice,
      };
    });

    const currentSizes = product.variants.map((v) => v.size);
    const currentColors = product.variants.map((v) => v.color);

    // related products
    let relatedProducts = await Product.find({
      isListed: true,
      _id: {$ne: product._id},
      category: product.category._id,

      $or: [
        {"variants.size": {$in: currentSizes}},
        {"variants.color": {$in: currentColors}},
      ],
    })
      .limit(4)
      .populate("category", "name discount");

    const updatedRelatedProducts = relatedProducts.map((p) => {
      const updatedVariants = p.variants.map((v) => {
        const finalPrice = getCategoryDiscountPrice(v.price, p.category);
        return {
          ...v.toObject(),
          finalPrice,
        };
      });

      return {
        ...p.toObject(),
        variants: updatedVariants,
      };
    });

    res.render("pages/productDetails", {
      product,
      relatedProducts: updatedRelatedProducts,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/products");
  }
};

// get home page
exports.getHomePage = async (req, res) => {
  try {
    let products = await Product.find({isListed: true})
      .populate("category", "name discount isDeleted")
      .populate("brand", "name logo isListed")
      .limit(12);

    products = products.filter(
      (p) =>
        p.category &&
        p.brand &&
        p.brand.isListed &&
        p.category.isDeleted === false,
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
    console.log("HOME PRODUCTS:", updatedProducts);
    res.render("pages/home", {products: updatedProducts});
  } catch (err) {
    console.error("Home Controller Error:", err);
    res.render("pages/home", {products: []});
  }
};
