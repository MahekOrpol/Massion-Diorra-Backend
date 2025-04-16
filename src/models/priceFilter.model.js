const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const { required } = require("joi");

const priceFilterSchema = mongoose.Schema(
  {
    
    filterPrice: {
      type: String,
      required:true
    },
   
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
priceFilterSchema.plugin(toJSON);
priceFilterSchema.plugin(paginate);

/**
 * @typedef PriceFilter
 */
const PriceFilter = mongoose.model("PriceFilter", priceFilterSchema);

module.exports = PriceFilter;
