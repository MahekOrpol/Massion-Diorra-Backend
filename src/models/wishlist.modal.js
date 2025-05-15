const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const wishlistSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Register", 
      required: true,
    },
    // userType: {
    //   type: String,
    //   enum: ["Register", "Admin"], // Helps identify which model to query
    //   required: true,
    // },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products", // Refers to Products schema
      required: true,
    },
    selectedMetal: {
      type: String,
      required: true,
    },
    selectedSize: {
      type: String,
      required: false,
    },
    selectedDiamondShape: {
      name: String,
      image: String
    },
    selectedShank: {
      name: String,
      image: String
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
wishlistSchema.plugin(toJSON);
wishlistSchema.plugin(paginate);

/**
 * @typedef Wishlist
 */
const Wishlist = mongoose.model("Wishlist", wishlistSchema);

module.exports = Wishlist;
