const express = require("express");
const { priceFilterController } = require("../../controllers");
const catchAsync = require("../../utils/catchAsync");
const validate = require("../../middlewares/validate");

const router = express.Router();

router.post('/create', validate(priceFilterController.createPriceFilter.validation), catchAsync(priceFilterController.createPriceFilter.handler));
router.get('/get-price', catchAsync(priceFilterController.getPriceFilter.handler));
router.put('/:priceId', catchAsync(priceFilterController.updatePriceFilter.handler));
router.delete('/:priceId', catchAsync(priceFilterController.deletePriceFilter.handler));

module.exports = router;