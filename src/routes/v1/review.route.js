const express = require('express');
const { reviewController } = require("../../controllers");
const catchAsync = require("../../utils/catchAsync");
const validate = require('../../middlewares/validate');

const router = express.Router();

router.post('/create',validate(reviewController.createReviewPro.validation),catchAsync(reviewController.createReviewPro.handler));

router.get("/get/product/:productId", reviewController.getReviewsByProductId.handler);

// Get all reviews
router.get("/get/all", reviewController.getAllReviews.handler);

module.exports = router;