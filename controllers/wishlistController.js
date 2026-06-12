const Wishlist = require("../models/wishlistModel");
const wishlistService = require("../services/wishlistService");

exports.toggleWishlist = async (req, res) => {
  try {
    const result = await wishlistService.toggleWishlist(
      req.user.id,
      req.params.productId,
    );

    const action = result.added ? "added" : "removed";

    res.json({
      success: true,
      action: action,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Wishlist failed",
    });
  }
};

exports.getWishlistPage = async (req, res) => {
  try {
    const wishlist = await wishlistService.getWishlistProducts(req.user.id);

    res.render("pages/wishlist", {
      wishlist,
    });
  } catch (err) {
    console.log(err);

    res.redirect("/");
  }
};

exports.removeWishlistItem = async (req, res) => {
  try {
    await wishlistService.removeWishlistProduct(
      req.user.id,
      req.params.productId,
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
    });
  }
};

exports.getWishlistCount = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      user: req.user._id,
    });

    res.json({
      wishlistCount: wishlist ? wishlist.products.length : 0,
    });
  } catch (err) {
    res.status(500).json({
      wishlistCount: 0,
    });
  }
};
