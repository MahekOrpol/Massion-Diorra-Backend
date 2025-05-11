const express = require("express");
const validate = require("../../middlewares/validate");
const reviewController = require("../../controllers/review.controller");
const catchAsync = require("../../utils/catchAsync");

const router = express.Router();

router
  .route("/")
  .post(
    validate(reviewController.createReview.validation),
    catchAsync(reviewController.createReview.handler)
  )
  .get(catchAsync(reviewController.getReviews.handler));

router
  .route("/:id")
  .patch(
    validate(reviewController.updateReview.validation),
    catchAsync(reviewController.updateReview.handler)
  )
  .delete(catchAsync(reviewController.deleteReview.handler));

router.get("/stats", catchAsync(reviewController.getReviewStats.handler));

module.exports = router;
