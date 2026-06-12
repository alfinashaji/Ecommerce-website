const express = require("express");

const router = express.Router();

const cartController = require("../controllers/cartController");

const auth = require("../middleware/authMiddleware");

router.get("/", auth, cartController.getCartPage);

router.post("/add/:productId", auth, cartController.addToCart);

router.patch("/quantity/:itemId", auth, cartController.updateQuantity);

router.delete("/remove/:itemId", auth, cartController.removeCartItem);
router.get("/count", auth, cartController.getCartCount);

module.exports = router;
