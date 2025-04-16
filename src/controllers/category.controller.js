const httpStatus = require("http-status");
const Joi = require("joi");
const ApiError = require("../utils/ApiError");
const Category = require("../models/category.model");
const { saveFile, removeFile } = require("../utils/helper");

const createCategory = {
  validation: {
    body: Joi.object().keys({
      categoryName: Joi.string().required(),
      categoryImage: Joi.string().optional(),
    }),
  },
  handler: async (req, res) => {
    console.log("req.body :>> ", req.body);
    
    const { categoryName } = req.body;
    console.log('req.file', req.files.categoryImage)
    let categoryImage = req.files.categoryImage ? await saveFile(req.files.categoryImage) : null;

    // Check if category already exists
    const categoryExists = await Category.findOne({ categoryName });
    if (categoryExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category already exists");
    }

    // Create new category
    const category = new Category({ categoryName, categoryImage: categoryImage.upload_path});
    await category.save();

    return res.status(httpStatus.CREATED).json({
      success: true,
      message: "Category created successfully",
      data: {
        id: category._id,
        categoryName: category.categoryName,
        categoryImage: category.categoryImage || null,
        createdAt: category.createdAt,
      },
    });
  },
};

const getCategory = {
  handler: async (req, res) => {
    const categories = await Category.find();
    return res.status(httpStatus.OK).send(categories);
  },
};

const updateCategory = {
  handler: async (req, res) => {
    const { _id } = req.params;
    const { categoryName } = req.body;

    let categoryImage = req.files && req.files.categoryImage ? await saveFile(req.files.categoryImage) : null;

    const categoryExists = await Category.findOne({ _id });
    if (!categoryExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category not found");
    }

    // Prevent duplicate category names
    const duplicateCategory = await Category.findOne({
      categoryName,
      _id: { $ne: _id },
    });
    if (duplicateCategory) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category already exists");
    }

    // Remove old image if a new one is uploaded
    if (categoryImage && categoryExists.categoryImage) {
      await removeFile(categoryExists.categoryImage);
    }

    // Update category
    categoryExists.categoryName = categoryName || categoryExists.categoryName;
    categoryExists.categoryImage = categoryImage?.upload_path || categoryExists.categoryImage;

    await categoryExists.save();

    return res.status(httpStatus.OK).send(categoryExists);
  },
};


// const deleteCategory = {
//   handler: async (req, res) => {
//     const { _id } = req.params;

//     const categoryExists = await Category.findOne({ _id });
//     if (!categoryExists) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "Category not found");
//     }

//     // Remove image if exists
//     if (categoryExists.categoryImage) {
//       await removeFile(categoryExists.categoryImage);
//     }

//     // Delete category
//     await Category.deleteOne({ _id });
//     return res.status(httpStatus.OK).send({ message: "Category deleted successfully" });
//   },
// };

const deleteCategory = {
  handler: async (req, res) => {
    try {
      const { _id } = req.params;

      if (!_id) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Category ID is required");
      }

      const category = await Category.findById(_id);
      if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
      }

      // Remove image if it exists
      if (category.categoryImage) {
        await removeFile(category.categoryImage);
      }

      await Category.findByIdAndDelete(_id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Delete category error:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = {
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
};
