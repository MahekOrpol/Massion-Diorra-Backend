const express = require("express");
const validate = require("../../middlewares/validate");
const reviewController = require("../../controllers/review.controller");

const router = express.Router();

router
  .route("/")
  .post(
    validate(reviewController.createReview.validation),
    reviewController.createReview.handler
  )
  .get(reviewController.getReviews.handler);

router
  .route("/:id")
  .patch(
    validate(reviewController.updateReview.validation),
    reviewController.updateReview.handler
  )
  .delete(reviewController.deleteReview.handler);

router.get("/stats", reviewController.getReviewStats.handler);

module.exports = router;
