const express = require("express");
const { handleWishlist, getAllWishlists, createWishlist, deleteeWishlist, getWishlist } = require("../../controllers/wishlist.controller");

const router = express.Router();

router.route("/create")
  .post(createWishlist)  // Add to wishlist
  
  router.route("/delete/:id").delete(deleteeWishlist) // Remove from wishlist
router.get("/:userId", getWishlist); // Get wishlist
router.get("/admin/wishlists", getAllWishlists);

module.exports = router;
