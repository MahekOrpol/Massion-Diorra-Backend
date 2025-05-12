const express = require("express");
const router = express.Router();
const wishlistController = require("../../controllers/wishlist.controller");
const validate = require("../../middlewares/validate");
const wishlistValidation = require("../../validations/wishlist.validation");

router
  .route("/")
  .post(validate(wishlistValidation.createWishlist), wishlistController.createWishlist)
  .get(wishlistController.getAllWishlists);

router
  .route("/:userId")
  .get(validate(wishlistValidation.getWishlist), wishlistController.getWishlist);

router
  .route("/:id")
  .delete(validate(wishlistValidation.deleteWishlist), wishlistController.deleteeWishlist);

module.exports = router;
