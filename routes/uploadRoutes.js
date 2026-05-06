const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const {uploadProfilePic} = require("../controllers/uploadController");

//file upload
router.post("/upload-photo", upload.single("profileImage"), uploadProfilePic);

module.exports = router;
