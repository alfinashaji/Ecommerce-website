const cartService = require("../services/cartService");
const wishlistService = require("../services/wishlistService");
const Product = require("../models/productModel");

exports.addToCart = async (req, res) => {
  try {
    let {size, color} = req.body;

    if (!size || !color) {
      const product = await Product.findById(req.params.productId);

      if (!product || !product.variants.length) {
        return res.status(400).json({
          success: false,
          message: "No variants available",
        });
      }

      size = product.variants[0].size;
      color = product.variants[0].color;
    }

    await cartService.addToCart(req.user.id, req.params.productId, size, color);

    await wishlistService.removeWishlistProduct(
      req.user.id,
      req.params.productId,
    );

    res.json({success: true});
  } catch (err) {
    console.log(err);

    res.status(400).json({
      success: false,
      message: err.message || "Failed to add to cart",
    });
  }
};

exports.getCartPage = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.user.id);

    let subtotal = 0;

    if (cart && cart.items && cart.items.length > 0) {
      cart.items.forEach((item) => {
        const variant = item.product.variants.find(
          (v) => v.size === item.size && v.color === item.color,
        );

        if (variant) {
          subtotal += (variant.finalPrice || variant.price) * item.quantity;
        }
      });
    }

    res.render("pages/cart", {
      cart: cart || {items: []},
      subtotal,
      total: subtotal,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    await cartService.updateQuantity(
      req.user.id,
      req.params.itemId,
      req.body.action,
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

exports.removeCartItem = async (req, res) => {
  try {
    await cartService.removeCartItem(req.user.id, req.params.itemId);

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

exports.getCartCount = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.user.id);

    const cartCount = cart
      ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
      : 0;

    res.json({cartCount});
  } catch (err) {
    res.status(500).json({cartCount: 0});
  }
};
