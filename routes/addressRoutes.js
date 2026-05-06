const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const addressController = require("../controllers/addressController");

router.get("/", auth, addressController.getAddresses);
router.get("/new", auth, (req, res) => {
  res.render("pages/addAddress");
});
router.post("/", auth, addressController.addAddress);
router.get("/:id/edit", auth, addressController.getEditAddress);
router.patch("/:id", auth, addressController.updateAddress);
router.delete("/:id", auth, addressController.deleteAddress);

module.exports = router;
