const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const auth = require('../../middlewares/auth');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.post('/send-otp',validate(authController.sendOtp.validation),catchAsync( authController.sendOtp.handler));
router.post('/verify-otp', validate(authController.verifyOTP.validation),catchAsync( authController.verifyOTP.handler));
router.post('/forgot-password',validate(authController.forgotPassword.validation),catchAsync(authController.forgotPassword.handler))

module.exports = router;
