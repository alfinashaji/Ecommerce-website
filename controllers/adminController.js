const User = require("../models/userModel");
const bcrypt = require("bcrypt");

// Dashboard
exports.getDashboard = async (req, res) => {
  res.render("admin/dashboard", {user: req.user});
};

const plainPassword = "Admin@12345";
const saltRounds = 10;

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
  console.log("Your Hashed Password is:", hash);
});
// Get users
exports.getUsers = async (req, res) => {
  try {
    let {search, clear, page, limit} = req.query;

    // reset search
    if (clear === "true") {
      search = "";
    }

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const skip = (page - 1) * limit;

    // base query (exclude admin)
    let query = {
      role: {$ne: "admin"},
    };

    // search filter
    if (search && search.trim() !== "") {
      page = 1;
      query.$or = [
        {fullName: {$regex: search, $options: "i"}},
        {email: {$regex: search, $options: "i"}},
      ];
    }

    // total count for pagination
    const totalUsers = await User.countDocuments(query);

    // users with pagination
    const users = await User.find(query)
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/users", {
      users,
      search: search || "",
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Block or unblock
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    user.status = user.status === "active" ? "blocked" : "active";
    await user.save();

    console.log("USER BLOCKED:", user.email);

    return res.json({
      message: `User ${user.status}`,
      status: user.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Server error"});
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const {email, password} = req.body;

    const admin = await User.findOne({email});

    if (!admin) {
      return res.render("admin/login", {error: "Admin not found"});
    }

    if (admin.role !== "admin") {
      return res.render("admin/login", {error: "Not an admin account"});
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.render("admin/login", {error: "Invalid password"});
    }

    delete req.session.userId;

    req.session.adminId = admin._id;

    console.log("ADMIN SESSION:", req.session);

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    res.render("admin/login", {error: "Something went wrong"});
  }
};
