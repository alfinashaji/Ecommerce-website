const User = require("../models/userModel");
const bcrypt = require("bcrypt");

exports.getPaginatedUsers = async (filters) => {
  let {search, clear, page, limit} = filters;

  if (clear === "true") {
    search = "";
  }

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  let query = {role: {$ne: "admin"}};

  if (search && search.trim() !== "") {
    page = 1;
    query.$or = [
      {fullName: {$regex: search, $options: "i"}},
      {email: {$regex: search, $options: "i"}},
    ];
  }

  const totalUsers = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalUsers / limit);

  return {
    users,
    search: search || "",
    currentPage: page,
    totalPages,
  };
};

exports.toggleUserStatusById = async (id) => {
  const user = await User.findById(id);
  if (!user) return null;

  user.status = user.status === "active" ? "blocked" : "active";
  await user.save();
  return user;
};

exports.authenticateAdmin = async (email, password) => {
  const admin = await User.findOne({email});

  if (!admin) {
    return {error: "Admin not found"};
  }

  if (admin.role !== "admin") {
    return {error: "Not an admin account"};
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return {error: "Invalid password"};
  }

  return {admin};
};
