const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const auth = require("../middleware/authMiddleware"); // Adjust based on your auth setup

router.get("/checkout", auth, checkoutController.getCheckoutPage);

router.post("/checkout/place-order", auth, checkoutController.placeOrder);

router.get("/checkout/order-success", auth, (req, res) => {
  res.render("pages/order-success", {
    orderId: req.query.id,
  });
});

router.get("/orders", auth, checkoutController.getOrders);
router.get(
  "/orders/details/:orderId/:productId",
  auth,
  checkoutController.getOrderProductDetails,
);

// cancel order

// router.post("/orders/:id/cancel", auth, checkoutController.cancelOrder);

// cancel sigle product

router.post(
  "/orders/:orderId/product/:productId/cancel",
  auth,
  checkoutController.cancelProduct,
);

// return order

router.post(
  "/orders/:orderId/product/:productId/return",
  auth,
  checkoutController.returnProduct,
);

// search order

router.get("/orders/search", auth, checkoutController.searchOrders);

// download

router.get("/orders/:id/invoice", auth, checkoutController.getInvoicePage);

router.get(
  "/orders/:id/invoice/download",
  auth,
  checkoutController.downloadInvoice,
);

module.exports = router;
