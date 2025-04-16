const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const cartSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Refers to User Schema
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products", // Refers to Product Schema
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugin to convert Mongoose to JSON
cartSchema.plugin(toJSON);
cartSchema.plugin(paginate);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
