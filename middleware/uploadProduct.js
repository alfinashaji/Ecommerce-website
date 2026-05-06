const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/productUploads");
  },

  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, name);
  },
});

const uploadProduct = multer({storage});

module.exports = uploadProduct;
