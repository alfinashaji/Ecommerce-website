const adminService = require("../services/adminService");
const Order = require("../models/orderModel");

// Dashboard
exports.getDashboard = async (req, res) => {
  res.render("admin/dashboard", {user: req.user});
};

// Get users
exports.getUsers = async (req, res) => {
  try {
    const result = await adminService.getPaginatedUsers(req.query);
    res.render("admin/users", result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Block or unblock
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await adminService.toggleUserStatusById(req.params.id);

    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    console.log("USER BLOCKED/UNBLOCKED:", user.email);

    return res.json({
      message: `User ${user.status}`,
      status: user.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Server error"});
  }
};

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const {email, password} = req.body;
    const result = await adminService.authenticateAdmin(email, password);

    if (result.error) {
      return res.render("admin/login", {error: result.error});
    }

    req.session.adminId = result.admin._id;
    console.log("ADMIN SESSION:", req.session);
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    res.render("admin/login", {error: "Something went wrong"});
  }
};

// Get orders list
exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 2;
    console.log("QUERY:", req.query);
    const search = req.query.q || "";
    const selectedStatus = req.query.status || "";
    const sort = req.query.sort || "newest";

    let filter = {};

    if (search) {
      filter.orderId = {
        $regex: search,
        $options: "i",
      };
    }

    if (selectedStatus) {
      filter.orderStatus = selectedStatus;
    }

    const sortOption = sort === "oldest" ? {createdAt: 1} : {createdAt: -1};
    const totalOrders = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate("user")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    res.render("admin/orders", {
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      selectedStatus,
      search,
      sort,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// Search orders
exports.searchOrders = async (req, res) => {
  try {
    const keyword = req.query.q || "";

    const orders = await Order.find({
      orderId: {
        $regex: keyword,
        $options: "i",
      },
    })
      .populate("user")
      .sort({createdAt: -1});

    res.render("admin/orders", {
      orders,
      selectedStatus: "",
      search: keyword,
      sort: "newest",
      currentPage: 1,
      totalPages: 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error processing search");
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const {id, productId} = req.params;

    const order = await Order.findById(id)
      .populate("user")
      .populate("products.product");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    let isolatedItem = null;
    if (productId) {
      isolatedItem = order.products.find(
        (p) =>
          p._id.toString() === productId ||
          p.product?._id.toString() === productId,
      );
    }

    res.render("admin/order-details", {
      order,
      item: isolatedItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const {id, productId} = req.params;
    const {status} = req.body;

    const order = await Order.findById(id).populate("products.product");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const item = order.products.find(
      (p) =>
        p._id.toString() === productId ||
        p.product?._id.toString() === productId,
    );

    if (!item) {
      return res.status(404).send("Product item not found in this order");
    }

    if (item.status === "Cancelled" && status !== "Cancelled") {
      return res.status(400).send("Cancelled items cannot be updated");
    }

    if (item.status === "Returned") {
      return res.status(400).send("Returned items cannot be updated");
    }

    const statusFlow = [
      "Placed",
      "Processing",
      "Shipped",
      "Out For Delivery",
      "Delivered",
    ];

    if (
      item.status !== "Cancelled" &&
      item.status !== "Returned" &&
      status !== "Cancelled"
    ) {
      const currentIndex = statusFlow.indexOf(item.status);
      const newIndex = statusFlow.indexOf(status);

      if (currentIndex !== -1 && newIndex !== -1 && newIndex < currentIndex) {
        return res.status(400).send("Cannot move order status backwards");
      }
    }

    const product = item.product;

    if (status === "Cancelled" && item.status !== "Cancelled") {
      if (product && product.variants) {
        const variant = product.variants.find(
          (v) => v.size === item.size && v.color === item.color,
        );
        if (variant) {
          variant.stock += item.quantity;
          await product.save();
        }
      }
    }

    item.status = status;

    const allItemsCancelled = order.products.every(
      (p) => p.status === "Cancelled",
    );
    if (allItemsCancelled) {
      order.orderStatus = "Cancelled";
    } else {
      order.orderStatus = status;
    }

    await order.save();

    res.redirect(`/admin/orders/${id}/product/${productId}`);
  } catch (error) {
    console.error(error);
    res.redirect("/admin/orders");
  }
};

exports.approveReturn = async (req, res) => {
  try {
    const {orderId, productId} = req.params;
    const order = await Order.findById(orderId).populate("products.product");

    if (!order) return res.status(404).send("Order reference not found");

    let item = order.products.id(productId);
    if (!item) {
      item = order.products.find(
        (p) =>
          p._id.toString() === productId ||
          p.product?._id.toString() === productId,
      );
    }

    if (!item) return res.redirect(`/admin/orders/${orderId}`);

    const currentStatus = (item.returnStatus || "").toLowerCase().trim();
    if (currentStatus !== "requested") {
      return res
        .status(400)
        .send("No valid return request matching target instance state");
    }

    const product = item.product;

    item.returnStatus = "approved";
    item.status = "Returned";

    if (product && product.variants) {
      const variant = product.variants.find(
        (v) => v.size === item.size && v.color === item.color,
      );
      if (variant) {
        variant.stock += item.quantity;
      }
      await product.save();
    }

    await order.save();
    res.redirect(`/admin/orders/${orderId}/product/${productId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error executing approval parameters sequence");
  }
};

exports.rejectReturn = async (req, res) => {
  try {
    const {orderId, productId} = req.params;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).send("Order reference not found");

    let item = order.products.id(productId);
    if (!item) {
      item = order.products.find((p) => p._id.toString() === productId);
    }

    if (!item) return res.redirect(`/admin/orders/${orderId}`);

    const currentStatus = (item.returnStatus || "").toLowerCase().trim();
    if (currentStatus !== "requested") {
      return res
        .status(400)
        .send("No target instance match found requesting actions");
    }

    item.returnStatus = "rejected";
    await order.save();

    res.redirect(`/admin/orders/${orderId}/product/${productId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error logging rejection properties parameters");
  }
};

exports.getSingleProductDetails = async (req, res) => {
  const {orderId, productId} = req.params;

  const order = await Order.findById(orderId)
    .populate("user")
    .populate("products.product");

  if (!order) {
    return res.redirect("/admin/orders");
  }

  const item = order.products.id(productId);

  if (!item) {
    return res.redirect("/admin/orders");
  }

  res.render("admin/order-details", {
    order,
    item,
  });
};
