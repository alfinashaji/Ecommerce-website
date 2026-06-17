const checkoutService = require("../services/checkoutService");
const Order = require("../models/orderModel");
const puppeteer = require("puppeteer");

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

exports.getOrderProductDetails = async (req, res) => {
  try {
    const {orderId, productId} = req.params;

    console.log("OrderId:", orderId);
    console.log("ProductId:", productId);

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    }).populate("products.product");

    console.log("Order Found:", !!order);

    if (!order) {
      return res.redirect("/orders");
    }

    const item = order.products.id(productId);

    console.log("Item Found:", !!item);

    if (!item) {
      return res.redirect("/orders");
    }

    res.render("pages/order-item-details", {
      order,
      item,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/orders");
  }
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

  res.redirect(`/orders/details/${order._id}/${item._id}`);
};

exports.cancelEntireOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "products.product",
    );

    if (!order) {
      return res.redirect("/orders");
    }

    for (const item of order.products) {
      if (
        item.status === "Cancelled" ||
        item.status === "Delivered" ||
        item.status === "Returned"
      ) {
        continue;
      }

      item.status = "Cancelled";
      item.cancelReason = req.body.reason || "";

      const product = item.product;

      if (product) {
        const variant = product.variants.find(
          (v) => v.size === item.size && v.color === item.color,
        );

        if (variant) {
          variant.stock += item.quantity;
        }

        await product.save();
      }
    }

    order.orderStatus = "Cancelled";

    await order.save();

    res.redirect(`/orders/details/${order._id}`);
  } catch (error) {
    console.error(error);
    res.redirect("/orders");
  }
};

// order return
exports.returnProduct = async (req, res) => {
  try {
    const {reason, reasonDetails} = req.body;

    if (!reason) {
      return res.status(400).send("Please select a return reason.");
    }

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.redirect("/orders");
    }

    const item = order.products.id(req.params.productId);

    if (!item) {
      return res.redirect("/orders");
    }

    // Check product delivery status
    if (item.status !== "Delivered") {
      return res.status(400).send("Only delivered products can be returned.");
    }

    // Prevent duplicate requests
    if (item.returnStatus === "requested" || item.returnStatus === "approved") {
      return res
        .status(400)
        .send("Return request already exists for this product.");
    }

    const finalReason = reasonDetails?.trim()
      ? `${reason} - ${reasonDetails.trim()}`
      : reason;

    item.returnStatus = "requested";
    item.returnReason = finalReason;

    await order.save();

    res.redirect(`/orders/details/${order._id}`);
  } catch (error) {
    console.error("Error submitting return request:", error);
    res
      .status(500)
      .send("Something went wrong processing your return request.");
  }
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
exports.getInvoicePage = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) {
      return res.redirect("/orders");
    }

    const deliveredItems = order.products.filter(
      (item) => item.status === "Delivered",
    );

    if (deliveredItems.length === 0) {
      return res.redirect("/orders");
    }

    res.render("pages/invoice", {
      order,
      deliveredItems,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/orders");
  }
};
exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

    const html = await new Promise((resolve, reject) => {
      req.app.render(
        "pages/invoice",
        {
          order,
          deliveredItems: order.products.filter(
            (item) => item.status === "Delivered",
          ),
        },
        (err, html) => {
          if (err) reject(err);
          else resolve(html);
        },
      );
    });

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${order.orderId}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to download invoice");
  }
};
