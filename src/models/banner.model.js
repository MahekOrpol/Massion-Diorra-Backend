const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const bannerSchema = new mongoose.Schema(
  {
    link: {
      type: String,
      default: "",
    },
    bannerText: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);

bannerSchema.plugin(toJSON);
