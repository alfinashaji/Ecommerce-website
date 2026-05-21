const uploadService = require("../services/uploadService");

exports.uploadProfilePic = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({message: "Not logged in"});
    }

    if (!req.file) {
      return res.status(400).json({message: "No file uploaded"});
    }

    const imagePath = await uploadService.updateUserProfileImage(
      userId,
      req.file.filename,
    );

    if (!imagePath) {
      return res.status(404).json({message: "User account not found"});
    }

    return res.json({
      message: "Upload success",
      image: imagePath,
    });
  } catch (error) {
    console.error("Profile Pic Upload Controller Error:", error);
    return res.status(500).json({message: "Upload failed"});
  }
};
