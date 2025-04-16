const express = require("express");

const {  paymentController } = require("../../controllers");
const router = express.Router();

// Create Order
router.post("/create-razorpay-order", paymentController.createRazorpayOrder);
router.post("/verify-razorpay-order", paymentController.verifyPayment);



module.exports = router;
