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
  const cart = await Cart.findOne({user: userId});

  const item = cart.items.id(itemId);

  if (!item) return null;

  if (action === "increase") {
    item.quantity += 1;
  }

  if (action === "decrease") {
    item.quantity -= 1;

    if (item.quantity <= 0) {
      item.remove();
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
