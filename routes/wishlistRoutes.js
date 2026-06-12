const router = require("express").Router();

const wishlistController = require("../controllers/wishlistController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, wishlistController.getWishlistPage);

router.post("/toggle/:productId", auth, wishlistController.toggleWishlist);

router.delete(
  "/remove/:productId",
  auth,
  wishlistController.removeWishlistItem,
);
router.get("/count", auth, wishlistController.getWishlistCount);
module.exports = router;
