const express = require('express');
const validate = require('../../middlewares/validate');
const aboutUsController = require('../../controllers/aboutUs.controller');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.post('/create', validate(aboutUsController.createAboutUs.validation), catchAsync(aboutUsController.createAboutUs.handler));
router.put('/update/:id', validate(aboutUsController.updateAboutUs.validation),catchAsync(aboutUsController.updateAboutUs.handler));
router.delete('/delete/:id',catchAsync(aboutUsController.deleteAboutUs.handler));
router.get('/get',catchAsync(aboutUsController.getAboutus.handler));

module.exports = router;

