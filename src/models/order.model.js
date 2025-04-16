const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const validator = require("validator"); // ✅ REQUIRED IMPORT
const Counter = require("./counter.model"); 

const orderSchema = mongoose.Schema(
  {
    orderId: {
      type: String,
    }, 
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Register",
      required: true,
    },

    razorpayId: {
      type: String,
      default: "mhk",
    },
    // addressId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Address",
    //   required: true,
    //   default: "addressId",
    // },

    discountTotal: {
      type: mongoose.Schema.Types.Decimal128,
      default: "0",
    },
    totalPrice: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      default: "0",
    },
    couponCode: {
      type: String,
      
    },
    selectedSize: {
      type: String,
      required: true,

    },
    selectedqty: {
      type: String,
      required: true,

    },
    status: {
      type: String,
      enum: ["pending", "confirm","shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", async function (next) {
  const doc = this;
  if (doc.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { id: "order" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seqNumber = counter.seq.toString().padStart(4, "0"); // 0001, 0002...
    doc.orderId = `${seqNumber}`;
  
  }
  next();
});


orderSchema.plugin(toJSON);
orderSchema.plugin(paginate);

/**
 * @typedef Order
 */
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
