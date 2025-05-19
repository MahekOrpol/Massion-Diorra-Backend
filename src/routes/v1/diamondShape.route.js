const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const { diamondShapeController } = require('../../controllers');

const router = express.Router();

router.post('/create', validate(diamondShapeController.createDiamondShape.validation), catchAsync(diamondShapeController.createDiamondShape.handler));
router.get('/get', catchAsync(diamondShapeController.getDiamondShape.handler));
router.delete('/delete/:_id', catchAsync(diamondShapeController.deleteDiamondShape.handler));   
router.put('/update/:_id', catchAsync(diamondShapeController.updateDiamondShape.handler));
module.exports = router;
