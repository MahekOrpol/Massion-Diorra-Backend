const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const ringSizeSchema = new mongoose.Schema({
  productSize: { type: String, required: true },
  regularPrice: { type: mongoose.Schema.Types.Decimal128, required: true },
  salePrice: { type: mongoose.Schema.Types.Decimal128, required: true },
  quantity: { type: Number, required: true },
});

const diamondShapeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  
});

const shankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
});

const metalVariationSchema = new mongoose.Schema({
  metal: { type: String, required: true },
  quantity: { type: String, required: true },
  images: { type: [String], default: [] },
  diamondShape: [diamondShapeSchema],
  shank: [shankSchema],
  ringSizes: [ringSizeSchema],
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review",
  },
  reviewCount: { type: Number, default: 0 },
});

const productVariationSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
    metalVariations: [metalVariationSchema],
  },
  { timestamps: true }
);

productVariationSchema.plugin(toJSON);

module.exports = mongoose.model("ProductVariation", productVariationSchema);
