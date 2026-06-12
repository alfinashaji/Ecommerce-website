const Wishlist = require("../models/wishlistModel");
const Product = require("../models/productModel");
const {getCategoryDiscountPrice} = require("../utils/discountHelper");

exports.toggleWishlist = async (userId, productId) => {
  const productCheck = await Product.findOne({_id: productId, isListed: true});
  if (!productCheck) {
    throw new Error("Product is currently unavailable or unlisted.");
  }

  let wishlist = await Wishlist.findOne({user: userId});

  if (!wishlist) {
    wishlist = new Wishlist({
      user: userId,
      products: [productId],
    });

    await wishlist.save();
    return {added: true};
  }

  const exists = wishlist.products.some((id) => id.toString() === productId);

  if (exists) {
    wishlist.products.pull(productId);
  } else {
    wishlist.products.push(productId);
  }

  await wishlist.save();

  return {
    added: !exists,
  };
};

exports.getWishlistProducts = async (userId) => {
  const wishlist = await Wishlist.findOne({user: userId})
    .populate({
      path: "products",
      match: {isListed: true},
      populate: [{path: "category"}, {path: "brand"}],
    })
    .lean();

  if (!wishlist || !wishlist.products) {
    return wishlist;
  }
  wishlist.products = wishlist.products.filter((product) => product !== null);

  wishlist.products = wishlist.products.map((product) => {
    if (product.variants && Array.isArray(product.variants)) {
      product.variants = product.variants.map((variant) => ({
        ...variant,
        finalPrice: getCategoryDiscountPrice(variant.price, product.category),
      }));
    }

    return product;
  });

  return wishlist;
};

exports.removeWishlistProduct = async (userId, productId) => {
  return await Wishlist.findOneAndUpdate(
    {user: userId},
    {
      $pull: {
        products: productId,
      },
    },
    {new: true},
  );
};
