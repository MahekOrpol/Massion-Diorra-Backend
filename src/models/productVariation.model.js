const mongoose = require('mongoose');

const { toJSON, paginate } = require("./plugins");
const productVariationSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productSize: { type: String, required: true }, 
    
    regularPrice: { type: Number, required: true }, 
    salePrice: { type: Number, required: true }, 
    discount: { type: Number, default: 0 }, 
    // stock: { type: Number, default: 0 }, 
  }, { timestamps: true });
  productVariationSchema.plugin(toJSON);
  module.exports = mongoose.model("ProductVariation", productVariationSchema);