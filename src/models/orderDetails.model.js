const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const orderSchema = mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products", // Refers to Products schema
      required: true,
    },
    variation: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariation",
        default: null,
      },
    ],

    orderId: {
      type: String,
      ref: "Order", // Refers to Products schema
      default: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Register",
      required: true,
    },
    productPrice: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
    quantity: {
      type: String,
    },
    productSize: {
      type: String,
    },
    discount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
    selectedqty: {
      type: String,
      required: true,
      default: 1,
    },
    // totalPrice: {
    //   type: String,
    // },
    // status: {
    //   type: String,
    //   enum: ["pending", "shipped", "delivered", "cancelled"],
    //   default: "pending",
    // },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
orderSchema.plugin(toJSON);
orderSchema.plugin(paginate);

/**
 * @typedef OrderDetails
 */
const OrderDetails = mongoose.model("OrderDetails", orderSchema);

module.exports = OrderDetails;
