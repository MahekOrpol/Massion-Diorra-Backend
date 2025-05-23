const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const shankSchema = mongoose.Schema(
  {
    shank: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

shankSchema.plugin(toJSON);
shankSchema.plugin(paginate);

/**
 * @typedef Shank
 */

const Shank = mongoose.model("Shank", shankSchema);
module.exports = Shank;
