const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const reviewSchema = mongoose.Schema(
  {
    msg: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: [String],
    },
    rating: {
      type: String,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products", 
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Register", required: true },
  },
  {
    timestamps: true,
  }
);
reviewSchema.plugin(toJSON);
/**
 * @typedef Review
 */
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
