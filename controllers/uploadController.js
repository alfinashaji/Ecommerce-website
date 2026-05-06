const User = require("../models/userModel");

exports.uploadProfilePic = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({message: "Not logged in"});
    }

    if (!req.file) {
      return res.status(400).json({message: "No file uploaded"});
    }

    const imagePath = "/uploads/" + req.file.filename;

    await User.findByIdAndUpdate(userId, {
      profileImage: imagePath,
    });

    res.json({
      message: "Upload success",
      image: imagePath,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Upload failed"});
  }
};
