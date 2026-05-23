const Wishlist = require("../models/wishlistModel");
const {getCategoryDiscountPrice} = require("../utils/discountHelper");

exports.toggleWishlist = async (userId, productId) => {
  let wishlist = await Wishlist.findOne({user: userId});

  if (!wishlist) {
    wishlist = new Wishlist({
      user: userId,
      products: [productId],
    });

    await wishlist.save();

    return {
      added: true,
    };
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
      populate: [{path: "category"}, {path: "brand"}],
    })
    .lean();

  if (!wishlist || !wishlist.products) {
    return wishlist;
  }

  wishlist.products = wishlist.products.map((product) => {
    product.variants = product.variants.map((variant) => ({
      ...variant,
      finalPrice: getCategoryDiscountPrice(variant.price, product.category),
    }));

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
