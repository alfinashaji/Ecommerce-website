const checkoutService = require("../services/checkoutService");
const Order = require("../models/orderModel");
const PDFDocument = require("pdfkit");

exports.getCheckoutPage = async (req, res) => {
  try {
    const data = await checkoutService.getCheckoutDetails(req.user.id);

    if (!data.cart) {
      return res.redirect("/cart");
    }

    res.render("pages/checkout", {
      cart: data.cart,
      addresses: data.addresses,
      pricing: data.pricing,
    });
  } catch (err) {
    console.error("Checkout page rendering error:", err);
    res.redirect("/cart");
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const {addressId, paymentMethod} = req.body;

    if (!addressId) {
      return res
        .status(400)
        .json({success: false, message: "Delivery address is required"});
    }

    if (paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment methodology selected",
      });
    }

    const freshOrder = await checkoutService.createCODOrder(
      req.user.id,
      addressId,
    );

    res.json({success: true, orderId: freshOrder._id});
  } catch (err) {
    console.error("Order completion crash tracking:", err);
    res
      .status(500)
      .json({success: false, message: err.message || "Order creation failed"});
  }
};

exports.getOrders = async (req, res) => {
  const orders = await Order.find({
    user: req.user.id,
  }).sort({createdAt: -1});

  res.render("pages/orders", {orders});
};

exports.getOrderDetails = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).populate("products.product");

  if (!order) {
    return res.redirect("/orders");
  }

  res.render("pages/order-details", {order});
};

// cancel order

exports.cancelOrder = async (req, res) => {
  console.log("CANCEL ORDER HIT");
  const {reason} = req.body;

  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).populate("products.product");

  if (!order) {
    return res.redirect("/orders");
  }

  order.orderStatus = "Cancelled";

  for (const item of order.products) {
    item.status = "Cancelled";
    item.cancelReason = reason || "";

    const product = item.product;

    const variant = product.variants.find(
      (v) => v.size === item.size && v.color === item.color,
    );

    if (variant) {
      variant.stock += item.quantity;
    }

    await product.save();
  }

  await order.save();

  res.redirect(`/orders/details/${order._id}`);
};

// cancel single product

exports.cancelProduct = async (req, res) => {
  const {reason} = req.body;

  const order = await Order.findById(req.params.orderId).populate(
    "products.product",
  );

  if (!order) {
    return res.redirect("/orders");
  }

  const item = order.products.id(req.params.productId);

  if (!item) {
    return res.redirect("/orders");
  }

  item.status = "Cancelled";
  item.cancelReason = reason || "";

  const variant = item.product.variants.find(
    (v) => v.size === item.size && v.color === item.color,
  );

  if (variant) {
    variant.stock += item.quantity;
  }

  await item.product.save();

  // Check if every product is cancelled
  const allCancelled = order.products.every(
    (product) => product.status === "Cancelled",
  );

  if (allCancelled) {
    order.orderStatus = "Cancelled";
  }

  await order.save();

  res.redirect(`/orders/details/${order._id}`);
};

// order return

exports.returnProduct = async (req, res) => {
  const {reason} = req.body;

  if (!reason) {
    return res.status(400).send("Return reason required");
  }

  const order = await Order.findById(req.params.orderId);

  const item = order.products.id(req.params.productId);

  if (order.orderStatus !== "Delivered") {
    return res.status(400).send("Cannot return");
  }

  item.status = "Return Requested";
  item.returnReason = reason;

  await order.save();

  res.redirect(`/orders/details/${order._id}`);
};

// serach order

exports.searchOrders = async (req, res) => {
  const keyword = req.query.q || "";

  const orders = await Order.find({
    user: req.user.id,
    orderId: {
      $regex: keyword,
      $options: "i",
    },
  });

  res.render("pages/orders", {orders});
};

exports.downloadInvoice = async (req, res) => {
  const order = await Order.findById(req.params.id);

  const doc = new PDFDocument();

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order.orderId}.pdf`,
  );

  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);

  doc.fontSize(20).text("Invoice");

  doc.moveDown();

  doc.text(`Order ID: ${order.orderId}`);
  doc.text(`Date: ${order.createdAt}`);

  doc.moveDown();

  order.products.forEach((item) => {
    doc.text(
      `${item.productName} x ${item.quantity} = ₹${item.finalPrice * item.quantity}`,
    );
  });

  doc.moveDown();

  doc.text(`Total: ₹${order.totalAmount}`);

  doc.end();
};
