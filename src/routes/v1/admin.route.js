const express = require('express');
const validate = require('../../middlewares/validate');
const admin = require('../../middlewares/admin');
const adminController = require('../../controllers/admin.controller')
const catchAsync = require('../../utils/catchAsync');


const router = express.Router();

router.post('/register', validate(adminController.registerAdmin.validation), catchAsync(adminController.registerAdmin.handler));
router.post('/login', validate(adminController.loginAdmin.validation), catchAsync(adminController.loginAdmin.handler));
router.get('/get', catchAsync(adminController.getAllUser.handler));

module.exports = router;