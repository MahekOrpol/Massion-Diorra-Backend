const Razorpay = require("razorpay");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazorpayOrder = catchAsync(async (req, res) => {
  const { amount, currency = "INR",  } = req.body;

  if (!amount ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Amount is required");
  }

  const options = {
    amount: amount * 100, // Amount in paise (1 INR = 100 paise)
    currency,
    receipt:`receipt_${Date.now()}`,
    payment_capture: 1, // Auto capture payment
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(httpStatus.CREATED).json({
      status: true,
      message: "Razorpay order created successfully",
      data: order,
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
});

const verifyPayment = catchAsync(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log(' req.body',  req.body)
  
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Missing required payment details");
    }
  
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
  
    if (generatedSignature !== razorpay_signature) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid payment signature");
    }
  
    
  
    res.status(httpStatus.OK).json({
      status: true,
      message: "Payment verified successfully",
    });
  });

module.exports = {
  createRazorpayOrder,
  verifyPayment
};
