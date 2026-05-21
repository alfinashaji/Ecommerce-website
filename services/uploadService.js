const User = require("../models/userModel");

exports.updateUserProfileImage = async (userId, filename) => {
  const imagePath = `/uploads/${filename}`;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {profileImage: imagePath},
    {new: true},
  );

  if (!updatedUser) return null;

  return imagePath;
};
