const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const { metalController } = require('../../controllers');

const router = express.Router();

router.post('/create', validate(metalController.createMetal.validation), catchAsync(metalController.createMetal.handler));
router.get('/get', catchAsync(metalController.getMetal.handler));
router.delete('/delete/:_id', catchAsync(metalController.deleteMetal.handler));
router.put('/update/:_id', catchAsync(metalController.updateMetal.handler));

module.exports = router;
