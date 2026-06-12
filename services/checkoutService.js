const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const cartService = require("./cartService");

exports.getCheckoutDetails = async (userId) => {
  const cart = await cartService.getCart(userId);
  if (!cart || !cart.items || cart.items.length === 0) {
    return {cart: null, addresses: [], pricing: null};
  }

  const addresses = await Address.find({user: userId});

  let subtotal = 0;
  cart.items.forEach((item) => {
    const variant = item.product.variants.find(
      (v) => v.size === item.size && v.color === item.color,
    );
    if (variant) {
      const activePrice = variant.finalPrice || variant.price;
      subtotal += activePrice * item.quantity;
    }
  });

  const taxRate = 0.05;
  const tax = subtotal * taxRate;
  const shipping = subtotal > 2000 ? 0 : 99;
  const total = subtotal + tax + shipping;

  return {
    cart,
    addresses,
    pricing: {subtotal, tax, shipping, total},
  };

  cart.items = cart.items.filter((item) => {
    const product = item.product;
    const variant = product.variants.find(
      (v) => v.size === item.size && v.color === item.color,
    );

    return product.isListed && variant && variant.stock >= item.quantity;
  });
};

exports.createCODOrder = async (userId, addressId) => {
  const cart = await cartService.getCart(userId);

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const selectedAddress = await Address.findById(addressId);

  if (!selectedAddress) {
    throw new Error("Address not found");
  }

  const products = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.product;

    if (!product.isListed) {
      throw new Error(`${product.name} is no longer available`);
    }

    const variant = product.variants.find(
      (v) => v.size === item.size && v.color === item.color,
    );

    if (!variant) {
      throw new Error(`Variant not available for ${product.name}`);
    }

    if (variant.stock < item.quantity) {
      throw new Error(
        `Insufficient stock for ${product.name} (${item.size}/${item.color})`,
      );
    }

    const price = variant.finalPrice || variant.price;

    subtotal += price * item.quantity;

    products.push({
      product: product._id,
      productName: product.name,
      productImage: variant.images?.[0] || "",

      quantity: item.quantity,
      size: item.size,
      color: item.color,

      price,
      finalPrice: price,
    });
    await Product.updateOne(
      {
        _id: product._id,
        "variants.size": item.size,
        "variants.color": item.color,
      },
      {
        $inc: {
          "variants.$.stock": -item.quantity,
        },
      },
    );
  }

  const shipping = subtotal > 2000 ? 0 : 99;
  const totalAmount = subtotal + shipping;

  const order = new Order({
    orderId: `ORD${Date.now()}`,
    user: userId,
    address: {
      name: selectedAddress.fullName,
      phone: selectedAddress.phone,
      street: selectedAddress.streetAddress,
      city: selectedAddress.city,
      state: selectedAddress.state,
      pincode: selectedAddress.postalCode,
    },
    products,
    subtotal,
    shipping,
    totalAmount,
    paymentMethod: "COD",
    paymentStatus: "Pending",
    orderStatus: "Placed",
  });

  await order.save();

  await Cart.findOneAndUpdate({user: userId}, {$set: {items: []}});

  return order;
};
