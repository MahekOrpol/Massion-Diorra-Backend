const express = require("express");
const { customJewelsController } = require("../../controllers");
const catchAsync = require("../../utils/catchAsync");
const validate = require("../../middlewares/validate");

const router = express.Router();

router.post('/create', validate(customJewelsController.createCustomJewel.validation), catchAsync(customJewelsController.createCustomJewel.handler));


module.exports = router;