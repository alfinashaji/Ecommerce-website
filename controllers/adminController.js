const adminService = require("../services/adminService");

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

    // Call authentication service logic
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
