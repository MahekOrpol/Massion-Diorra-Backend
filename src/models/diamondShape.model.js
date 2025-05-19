const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const diamondShapeSchema = mongoose.Schema(
  {
    diamondShape: {
      type: String,
      required: true,
      trim: true,
    },
    diamondImage: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

diamondShapeSchema.plugin(toJSON);
diamondShapeSchema.plugin(paginate);

/**
 * @typedef DiamondShape
 */

const DiamondShape = mongoose.model("DiamondShape", diamondShapeSchema);
module.exports = DiamondShape;
