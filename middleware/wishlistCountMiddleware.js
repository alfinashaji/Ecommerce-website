const Wishlist = require("../models/wishlistModel");

module.exports = async (req, res, next) => {
  try {
    if (req.user) {
      const wishlist = await Wishlist.findOne({
        user: req.user._id,
      }).populate("products");

      res.locals.wishlistCount = wishlist
        ? wishlist.products.filter(
            (product) => product && product.isListed === true,
          ).length
        : 0;
    } else {
      res.locals.wishlistCount = 0;
    }

    next();
  } catch (err) {
    console.error(err);
    res.locals.wishlistCount = 0;
    next();
  }
};
