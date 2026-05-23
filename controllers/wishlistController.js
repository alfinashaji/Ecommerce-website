const wishlistService = require("../services/wishlistService");

exports.toggleWishlist = async (req, res) => {
  try {
    const result = await wishlistService.toggleWishlist(
      req.user.id,
      req.params.productId,
    );

    res.json(result);
  } catch (err) {
    console.log(err);

    res.status(500).json({
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
