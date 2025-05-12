const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const { giftingGuideController } = require('../../controllers');


const router = express.Router();

router.post('/create', validate(giftingGuideController.createGiftingGuide.validation), catchAsync(giftingGuideController.createGiftingGuide.handler));
router.get('/get', catchAsync(giftingGuideController.getGiftingGuide.handler));
router.delete('/delete/:_id', catchAsync(giftingGuideController.deleteGiftingGuide.handler));
router.put('/update/:_id', validate(giftingGuideController.updateGiftingGuide.validation), catchAsync(giftingGuideController.updateGiftingGuide.handler));
module.exports = router;    
