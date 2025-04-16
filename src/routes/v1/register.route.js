const express = require('express');
const validate = require('../../middlewares/validate');
const admin = require('../../middlewares/admin');
const catchAsync = require('../../utils/catchAsync');
const { registerController } = require('../../controllers');


const router = express.Router();

router.post('/register', validate(registerController.register.validation), catchAsync(registerController.register.handler));
router.post('/login', validate(registerController.login.validation), catchAsync(registerController.login.handler));
router.get('/get', catchAsync(registerController.getAllUser.handler));

router.get('/single/:id', catchAsync(registerController.getUserById.handler));
module.exports = router;