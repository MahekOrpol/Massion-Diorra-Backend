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
