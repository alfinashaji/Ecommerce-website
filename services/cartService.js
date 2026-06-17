const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const {getCategoryDiscountPrice} = require("../utils/discountHelper");

exports.addToCart = async (userId, productId, size, color) => {
  const product = await Product.findOne({
    _id: productId,
    isListed: true,
  });

  if (!product) {
    throw new Error("Product is unavailable or blocked");
  }

  const variant = product.variants.find(
    (v) => v.size === size && v.color === color,
  );

  if (!variant) {
    throw new Error("Selected variant not found");
  }

  // Stock check
  if (variant.stock <= 0) {
    throw new Error("This variant is out of stock");
  }

  let cart = await Cart.findOne({user: userId});

  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [
        {
          product: productId,
          quantity: 1,
          size,
          color,
        },
      ],
    });

    await cart.save();
    return;
  }

  const existingItem = cart.items.find(
    (item) =>
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color,
  );

  if (existingItem) {
    // Prevent quantity exceeding stock
    if (existingItem.quantity >= variant.stock) {
      throw new Error(`Only ${variant.stock} item(s) available in stock`);
    }

    existingItem.quantity += 1;
  } else {
    cart.items.push({
      product: productId,
      quantity: 1,
      size,
      color,
    });
  }

  await cart.save();
};

exports.getCart = async (userId) => {
  const cart = await Cart.findOne({user: userId})
    .populate({
      path: "items.product",
      populate: [{path: "category"}, {path: "brand"}],
    })
    .lean();

  if (!cart) return null;
  cart.items = cart.items.filter(
    (item) => item.product && item.product.isListed,
  );

  cart.items = cart.items.map((item) => {
    if (item.product && item.product.variants) {
      item.product.variants = item.product.variants.map((variant) => ({
        ...variant,
        finalPrice: getCategoryDiscountPrice(
          variant.price,
          item.product.category,
        ),
      }));
    }
    return item;
  });

  return cart;
};

exports.updateQuantity = async (userId, itemId, action) => {
  const cart = await Cart.findOne({user: userId}).populate("items.product");

  const item = cart.items.id(itemId);

  if (!item) {
    throw new Error("Cart item not found");
  }

  if (action === "increase") {
    const variant = item.product.variants.find(
      (v) => v.size === item.size && v.color === item.color,
    );

    if (!variant) {
      throw new Error("Variant not found");
    }

    if (item.quantity >= variant.stock) {
      throw new Error("Only " + variant.stock + " items available in stock");
    }

    item.quantity += 1;
  }

  if (action === "decrease") {
    item.quantity -= 1;

    if (item.quantity <= 0) {
      cart.items.pull(itemId);
    }
  }

  await cart.save();

  return cart;
};

exports.removeCartItem = async (userId, itemId) => {
  const cart = await Cart.findOne({user: userId});

  cart.items.pull(itemId);

  await cart.save();

  return cart;
};
