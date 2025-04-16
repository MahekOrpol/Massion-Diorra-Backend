const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const Order = require("../models/order.model");
const OrderDetails = require("../models/orderDetails.model");
const SavedAddress = require("../models/savedAddress.model");
const Joi = require("joi");
const mongoose = require("mongoose");
const { Products } = require("../models");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const createOrder = catchAsync(async (req, res) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    razorpayId: Joi.string().optional(),
    discountTotal: Joi.number().optional(),
    totalPrice: Joi.number().required(),
    couponCode: Joi.string().optional(),
    status: Joi.string()
      .valid("pending", "shipped", "delivered", "cancelled")
      .optional(),
    paymentStatus: Joi.string().valid("Paid", "Unpaid").optional(),
    saveInfo: Joi.boolean().optional(),
    email: Joi.string()
      .trim()
      .lowercase()
      .email({ tlds: { allow: false } })
      .optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    address: Joi.string().optional(),
    country: Joi.string().optional(),
    apartment: Joi.string().optional().allow(""),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    selectedSize: Joi.string().required(),
    selectedqty: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body, { allowUnknown: true });
  if (error)
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);

  const { userId, saveInfo } = value;
  const pendingOrderDetails = await OrderDetails.find({ userId, orderId: 0 });
  if (!pendingOrderDetails || pendingOrderDetails.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No pending order details found for this user"
    );
  }

  const order = await Order.create({
    userId: mongoose.Types.ObjectId(userId),
    razorpayId: value.razorpayId,
    discountTotal: value.discountTotal || 0,
    totalPrice: value.totalPrice,
    couponCode: value.couponCode,
    status: value.status || "pending",
    paymentStatus: value.paymentStatus || "Unpaid",
    selectedSize: value.selectedSize,
    selectedqty: value.selectedqty,
  });

  await OrderDetails.updateMany(
    { userId, orderId: 0 },
    { $set: { orderId: order.orderId } }
  );

  if (saveInfo) {
    const addressSchema = Joi.object({
      email: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      address: Joi.string().required(),
      country: Joi.string().required(),
      apartment: Joi.string().optional().allow(""),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      phoneNumber: Joi.string().required(),
    });

    const { error: addressError } = addressSchema.validate(value);
    if (addressError) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Address fields are missing for saveInfo"
      );
    }

    await SavedAddress.findOneAndUpdate(
      { userId: mongoose.Types.ObjectId(userId) },
      {
        userId: mongoose.Types.ObjectId(userId),
        email: value.email,
        firstName: value.firstName,
        lastName: value.lastName,
        address: value.address,
        country: value.country,
        apartment: value.apartment,
        city: value.city,
        state: value.state,
        zipCode: value.zipCode,
        phoneNumber: value.phoneNumber,
      },
      { upsert: true, new: true }
    );
  }
  const orderDetails = await OrderDetails.find({ orderId: order.orderId });
  for (const detail of orderDetails) {
    const selectedqty = Number(detail.selectedqty);
    console.log("selectedqty :>> ", selectedqty);
    const product = await Products.findById(detail.productId);
    if (product) {
      const currentQty = Number(product.quantity); // convert product quantity to int
      const newQty = currentQty - selectedqty;

      console.log("currentQty :>> ", currentQty);
      // Update product quantity in DB (store as string if needed)
      await Products.findByIdAndUpdate(detail.productId, {
        quantity: newQty.toString(),
      });

      console.log(`Updated product ${product._id} quantity to ${newQty}`);
    }
  }

  return res.status(httpStatus.CREATED).json({
    status: true,
    message: "Order created successfully and orderId updated in OrderDetails",
    data: order,
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const orders = await Order.find().populate("productId").populate("userId");

  res.status(httpStatus.OK).json({
    status: true,
    message: "Orders fetched successfully",
    data: orders,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const schema = Joi.object({
    razorpayId: Joi.string().optional(),
    discountTotal: Joi.number().optional(),
    totalPrice: Joi.number().optional(),
    couponCode: Joi.string().optional(),
    status: Joi.string()
      .valid("pending", "confirm", "shipped", "delivered", "cancelled")
      .optional(),
    paymentStatus: Joi.string().valid("Paid", "Unpaid").optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error)
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);

  const { status } = value;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  Object.assign(order, value);
  await order.save();

  res.status(httpStatus.OK).json({
    status: true,
    message: "Order status updated successfully",
    data: order,
  });
});

const getSingleOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({ orderId })
    .populate("userId") // Populate user details
    .lean();

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  const orderDetails = await OrderDetails.find({ orderId: order.orderId })
    .populate("productId") // Populate user details
    .lean();

  res.status(httpStatus.OK).json({
    status: true,
    message: "Order fetched successfully",
    data: {
      order,
      orderDetails,
    },
  });
});

const getUserOrders = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const orders = await Order.find({ userId: mongoose.Types.ObjectId(userId) })
    .populate("userId")
    .lean();

  if (!orders || orders.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No orders found for this user");
  }

  const ordersWithDetails = await Promise.all(
    orders.map(async (order) => {
      // Fetch order details
      const orderDetails = await OrderDetails.find({ orderId: order.orderId })
        .populate({
          path: "productId", // Assuming productId is stored in OrderDetails
          model: "Products", // Reference to the Product model
        })
        .lean();

      return {
        ...order,
        orderDetails,
      };
    })
  );

  res.status(httpStatus.OK).json({
    status: true,
    message: "User orders fetched successfully",
    data: ordersWithDetails,
  });
});

const getSavedAddress = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const savedAddress = await SavedAddress.findOne({ userId });

    if (!savedAddress) {
      return res.status(404).json({ message: "No saved address found" });
    }

    res.status(200).json(savedAddress);
  } catch (error) {
    console.error("Error fetching saved address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const printOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({ _id: orderId }).populate("userId").lean();

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  const orderDetails = await OrderDetails.find({ orderId })
    .populate("productId")
    .lean();

  res.status(httpStatus.OK).json({
    status: true,
    message: "Order ready for printing",
    data: {
      order,
      orderDetails,
    },
  });
});

const generateOrderPDF = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  // Fetch the order and order details
  const order = await Order.findOne({ orderId: orderId })
    .populate("userId")
    .lean();

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  const orderDetails = await OrderDetails.find({ orderId })
    .populate("productId")
    .lean();

  // Create a PDF document
  const doc = new PDFDocument();

  // Set the output file path
  const outputPath = path.join(__dirname, `../uploads/order_${orderId}.pdf`);

  doc.pipe(fs.createWriteStream(outputPath));

  // Add content to the PDF
  doc.fontSize(16).text(`Order Summary`, { align: "center" }).moveDown(2);

  doc.fontSize(12).text(`Order ID: ${orderId}`);
  doc.text(`User: ${order.userId.firstName} ${order.userId.lastName}`);
  doc.text(`Email: ${order.userId.email}`);
  doc.text(`Total Price: $${order.totalPrice}`);
  doc.text(`Status: ${order.status}`);
  doc.text(`Payment Status: ${order.paymentStatus}`);

  doc.moveDown();

  doc.text("Order Details:", { underline: true }).moveDown();

  orderDetails.forEach((detail) => {
    doc.text(`- Product: ${detail.productId.name}`);
    doc.text(`  Quantity: ${detail.quantity}`);
    doc.text(`  Price: $${detail.productId.price}`);
    doc.moveDown();
  });

  doc.end();

  // After PDF is created, send it as a response
  doc.on("finish", () => {
    res.status(httpStatus.OK).json({
      status: true,
      message: "PDF generated successfully",
      data: {
        pdfUrl: `/uploads/order_${orderId}.pdf`,
      },
    });
  });
});

module.exports = {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  getSingleOrder,
  getUserOrders,
  getSavedAddress,
  printOrder,
  generateOrderPDF,
};
