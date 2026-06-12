const Cart = require("../models/cartModel");

module.exports = async (req, res, next) => {
  try {
    if (req.user) {
      const cart = await Cart.findOne({user: req.user._id}).populate(
        "items.product",
      );

      res.locals.cartCount = cart
        ? cart.items
            .filter((item) => item.product && item.product.isListed === true)
            .reduce((sum, item) => sum + item.quantity, 0)
        : 0;
    } else {
      res.locals.cartCount = 0;
    }

    next();
  } catch (err) {
    console.error(err);
    res.locals.cartCount = 0;
    next();
  }
};
