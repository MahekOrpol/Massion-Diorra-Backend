const express = require('express');
const validate = require('../../middlewares/validate');
const contactUsController = require('../../controllers/contactUs.controller');
const catchAsync = require('../../utils/catchAsync');


const router = express.Router();

router.post('/create', validate(contactUsController.createContactUs.validation), catchAsync(contactUsController.createContactUs.handler));
router.get('/get', catchAsync(contactUsController.getAllContactUs.handler));
router.delete('/delete/:id', catchAsync(contactUsController.deleteContactUs.handler));
router.put('/update/:id', validate(contactUsController.updateContactUs.validation), catchAsync(contactUsController.updateContactUs.handler));
module.exports = router;    
