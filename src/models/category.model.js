const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const categoriesSchema = mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    categoryImage: {
      type: String, // Storing image URL or file path
      trim: true,
    },
    style: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        name: {
          type: String,
          require: true,
          trim: true,
        },
        image: {
          type: String, // Storing image URL or file path
          trim: true,
        },
      },
    ],
    subcategories: [
      {
        subcategoryName: { type: String, required: true, trim: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
categoriesSchema.plugin(toJSON);
categoriesSchema.plugin(paginate);

/**
 * @typedef Category
 */
const Category = mongoose.model("Category", categoriesSchema);

module.exports = Category;
