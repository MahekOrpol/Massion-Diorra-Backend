const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const { ProductVariations } = require("./index");

const productsSchema = mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: String,
      required: true,
      trim: true,
    },

    best_selling: {
      type: String,
      trim: true,
      default: "0",
    },

    review: {
      type: String,
      trim: true,
    },
    rating: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    productsDescription: {
      type: String,
      trim: true,
    },
    salePrice: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
    regularPrice: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    image: {
      type: [String],
      default: [],
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: String,
    },
    discount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
    // productSize: {
    //   type: String,
    // },
    productSize: {
      type: [String], // Changed from String to an array of strings
      default: [""], // Default value as an empty array
    },
    gender: {
      type: String,
      default: "",
    },
    hasVariations: { type: Boolean, default: false },
    variations: [
      { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariation" },
    ],
  },
  {
    timestamps: true,
  }
);

productsSchema.pre("findOneAndDelete", async function (next) {
  try {
    const product = await this.model.findOne(this.getQuery());
    if (product) {
      await ProductVariations.deleteMany({ productId: product._id });
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware for direct `deleteOne`
productsSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      await ProductVariations.deleteMany({ productId: this._id });
      next();
    } catch (error) {
      next(error);
    }
  }
);

// Middleware for multiple product deletion
// productsSchema.pre("deleteMany", async function (next) {
//   try {
//     console.log('deleteMany---> ')
//     const products = await this.model.find(this.getQuery()); // Get all matching products
//     const productIds = products.map((product) => product._id); // Extract IDs
//     if (productIds.length) {
//       await ProductVariations.deleteMany({ productId: { $in: productIds } });
//     }
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// add plugin that converts mongoose to json
productsSchema.plugin(toJSON);
productsSchema.plugin(paginate);

/**
 * @typedef Products
 */
const Products = mongoose.model("Products", productsSchema);

module.exports = Products;
