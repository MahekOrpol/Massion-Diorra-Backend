const express = require("express");
const {  orderDetailsController } = require("../../controllers");
const {
  updateOrderStatus,
  getOrderById,
  getAllOrders,
} = require("../../controllers/orderDetails.controller");
const auth = require("../../middlewares/auth");
const router = express.Router();

// Create Order
router.post("/create", orderDetailsController.createOrder);
router.put("/update/:userId/:productId", updateOrderStatus);
router.get("/get/:userId", getOrderById);
router.get("/get-all", getAllOrders);

router.delete('/delete/:orderId',orderDetailsController.deleteOrderDetails)

module.exports = router;
