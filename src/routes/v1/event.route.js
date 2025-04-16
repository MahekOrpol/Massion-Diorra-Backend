const express = require('express');
const validate = require('../../middlewares/validate');
const eventController = require('../../controllers/event.controller')
const catchAsync = require('../../utils/catchAsync');
const auth = require('../../middlewares/auth');


const router = express.Router();

router.post('/create',auth(),validate(eventController.createEvent.validation),catchAsync(eventController.createEvent.handler));
router.get('/get',auth(),catchAsync(eventController.getEvent.handler));
router.put('/update/:id',validate(eventController.updateEvent.validation),catchAsync(eventController.updateEvent.handler));


module.exports = router;