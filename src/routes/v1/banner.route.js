const express = require("express");
const router = express.Router();
const bannerController = require("../../controllers/banner.controller");
const validate = require("../../middlewares/validate");
const catchAsync = require("../../utils/catchAsync");

router.get("/", catchAsync(bannerController.getBanners.handler));

router.post(
  "/",
  validate(bannerController.createBanner.validation),
  catchAsync(bannerController.createBanner.handler)
);

router.put(
  "/:id",
  validate(bannerController.updateBanner.validation),
  catchAsync(bannerController.updateBanner.handler)
);

router.delete("/:id", catchAsync(bannerController.deleteBanner.handler));

module.exports = router;
