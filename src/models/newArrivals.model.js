const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const newArrivalsSchema = mongoose.Schema(
  {
    image: {
      type: String, // Storing image URL or file path
      trim: true,
    },
    title: {
      type: String,
      required: false,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
newArrivalsSchema.plugin(toJSON);
newArrivalsSchema.plugin(paginate);

/**
 * @typedef NewArrivals
 */
const NewArrivals = mongoose.model("NewArrivals", newArrivalsSchema);

module.exports = NewArrivals;
