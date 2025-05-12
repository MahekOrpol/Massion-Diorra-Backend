const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const {  newArrivalsController } = require('../../controllers');


const router = express.Router();

router.post('/create', validate(newArrivalsController.createNewArrivals.validation), catchAsync(newArrivalsController.createNewArrivals.handler));
router.get('/get', catchAsync(newArrivalsController.getNewArrivals.handler));
router.delete('/delete/:_id', catchAsync(newArrivalsController.deleteNewArrivals.handler));
// optional
router.put('/update/:_id', validate(newArrivalsController.updateNewArrivals.validation), catchAsync(newArrivalsController.updateNewArrivals.handler));

router.post('/create/headline', validate(newArrivalsController.createNewArrivalsHeadline.validation), catchAsync(newArrivalsController.createNewArrivalsHeadline.handler));
router.get('/get/headline', catchAsync(newArrivalsController.getNewArrivalsHeadline.handler));
router.delete('/delete/headline/:_id', catchAsync(newArrivalsController.deleteNewArrivalsHeadline.handler));
router.put('/update/headline/:_id', validate(newArrivalsController.updateNewArrivalsHeadline.validation), catchAsync(newArrivalsController.updateNewArrivalsHeadline.handler));

module.exports = router;    
