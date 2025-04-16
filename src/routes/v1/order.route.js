const express = require("express");

const auth = require("../../middlewares/auth");
const { orderController } = require("../../controllers");
const { getSavedAddress, printOrder, generateOrderPDF } = require("../../controllers/order.controller");
const router = express.Router();

// Create Order
router.post("/create", orderController.createOrder);
router.get("/get", orderController.getAllOrders);
router.put('/update-status/:orderId', orderController.updateOrderStatus);
router.get('/get-single/:orderId', orderController.getSingleOrder);
router.get('/get-user/:userId', orderController.getUserOrders);

router.get("/address/:userId", getSavedAddress);

router.get("/print/:orderId", printOrder);

router.get("/:orderId/generate-pdf", generateOrderPDF);


module.exports = router;
