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

    delete req.session.userId;
    req.session.adminId = result.admin._id;

    console.log("ADMIN SESSION:", req.session);
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    res.render("admin/login", {error: "Something went wrong"});
  }
};

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
    console.log(error);
    res.status(500).send("Server Error");
  }
};

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
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user")
      .populate("products.product");

    res.render("admin/order-details", {order});
  } catch (error) {
    console.log(error);
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const {id} = req.params;
    const {status} = req.body;
    console.log("PARAMS:", req.params);
    console.log("BODY:", req.body);
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    order.orderStatus = status;

    order.products.forEach((item) => {
      item.status = status;
    });

    await order.save();

    res.redirect("/admin/orders");
  } catch (error) {
    console.log(error);
    res.redirect("/admin/orders");
  }
};

exports.approveReturn = async (req, res) => {
  try {
    const {orderId, productId} = req.params;

    const order = await Order.findById(orderId).populate("products.product");

    const item = order.products.id(productId);

    if (!item) {
      return res.redirect("/admin/orders");
    }

    item.status = "Returned";

    const variant = item.product.variants.find(
      (v) => v.size === item.size && v.color === item.color,
    );

    if (variant) {
      variant.stock += item.quantity;
    }

    await item.product.save();
    await order.save();

    res.redirect(`/admin/orders/${orderId}`);
  } catch (error) {
    console.log(error);
    res.redirect("/admin/orders");
  }
};
