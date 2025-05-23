const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const { shankController } = require('../../controllers');

const router = express.Router();

router.post('/create', validate(shankController.createShank.validation), catchAsync(shankController.createShank.handler));
router.get('/get', catchAsync(shankController.getShank.handler));
router.delete('/delete/:_id', catchAsync(shankController.deleteShank.handler));   
router.put('/update/:_id', catchAsync(shankController.updateShank.handler));
module.exports = router;
