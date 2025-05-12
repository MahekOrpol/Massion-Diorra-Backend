const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const giftingGuideSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String, // Storing image URL or file path
      trim: true,
    },
  
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
giftingGuideSchema.plugin(toJSON);
giftingGuideSchema.plugin(paginate);

/**
 * @typedef GiftingGuide
 */
const GiftingGuide = mongoose.model("GiftingGuide", giftingGuideSchema);

module.exports = GiftingGuide;
