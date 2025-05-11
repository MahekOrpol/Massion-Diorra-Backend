const express = require("express");
const router = express.Router();
const testimonialController = require("../../controllers/testimonial.controller");
const validate = require("../../middlewares/validate");
const catchAsync = require("../../utils/catchAsync");

router
  .route("/")
  .post(
    validate(testimonialController.createTestimonial.validation),
    catchAsync(testimonialController.createTestimonial.handler)
  )
  .get(catchAsync(testimonialController.getTestimonials.handler));

router
  .route("/:id")
  .patch(
    validate(testimonialController.updateTestimonial.validation),
    catchAsync(testimonialController.updateTestimonial.handler)
  )
  .delete(catchAsync(testimonialController.deleteTestimonial.handler));

module.exports = router;
