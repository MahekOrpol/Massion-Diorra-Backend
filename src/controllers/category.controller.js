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

    const { categoryName, subcategories } = req.body;
    console.log("req.file", req.files.categoryImage);
    let categoryImage = req.files.categoryImage
      ? await saveFile(req.files.categoryImage)
      : null;

    // Check if category already exists
    const categoryExists = await Category.findOne({ categoryName });
    if (categoryExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category already exists");
    }

    const parsedSubcategories = subcategories
      ? JSON.parse(subcategories) // expecting a JSON string from form-data
      : [];

    const category = new Category({
      categoryName,
      categoryImage: categoryImage?.upload_path,
      subcategories: parsedSubcategories,
    });

    // Create new category
    // const category = new Category({ categoryName, categoryImage: categoryImage.upload_path});
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

const getSubcategories = {
  handler: async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    return res.status(httpStatus.OK).json({
      success: true,
      subcategories: category.subcategories || [],
    });
  },
};

const addSubcategory = {
  handler: async (req, res) => {
    const { id } = req.params;
    const { subcategoryName } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    const isDuplicate = category.subcategories.some(
      (sub) =>
        sub.subcategoryName.toLowerCase() === subcategoryName.toLowerCase()
    );
    if (isDuplicate) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Subcategory already exists");
    }

    const newSubcategory = {
      subcategoryName,
      createdAt: new Date(), // Explicitly set createdAt field
    };

    category.subcategories.push(newSubcategory);
    await category.save();

    // Get the newly added subcategory including the createdAt field
    const addedSubcategory =
      category.subcategories[category.subcategories.length - 1];

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Subcategory added successfully",
      data: {
        subcategoryName: addedSubcategory.subcategoryName,
      },
    });
  },
};

const updateSubcategory = {
  handler: async (req, res) => {
    const { id, subcategoryId } = req.params;
    const { subcategoryName } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found");
    }

    // Check for duplicate name
    const isDuplicate = category.subcategories.some(
      (sub) =>
        sub.id.toString() !== subcategoryId &&
        sub.subcategoryName.toLowerCase() === subcategoryName.toLowerCase()
    );
    if (isDuplicate) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Subcategory already exists");
    }

    subcategory.subcategoryName =
      subcategoryName || subcategory.subcategoryName;

    await category.save();

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Subcategory updated successfully",
      data: subcategory,
    });
  },
};

const updateCategory = {
  handler: async (req, res) => {
    const { _id } = req.params;
    const { categoryName } = req.body;

    let categoryImage =
      req.files && req.files.categoryImage
        ? await saveFile(req.files.categoryImage)
        : null;

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
    categoryExists.categoryImage =
      categoryImage?.upload_path || categoryExists.categoryImage;

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

const deleteSubcategory = {
  handler: async (req, res) => {
    const { id, subcategoryId } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found");
    }

    subcategory.remove();
    await category.save();

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  },
};

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

const addStyle = {
  validation: {
    body: Joi.object().keys({
      name: Joi.string().required(), // Style name is required
      image: Joi.string().optional(), // Style image is optional
    }),
  },
  handler: async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    // Check if style already exists (case-insensitive)
    const isDuplicate = category.style.some(
      (style) => style.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Style already exists");
    }
    let image = req.files.image ? await saveFile(req.files.image) : null;
    // Create new style object
    const newStyle = {
      name,
      image: image?.upload_path || null, // Set image if provided, otherwise null
    };

    // Add style to category
    category.style.push(newStyle);
    await category.save();

    // Get the newly added style
    const addedStyle = category.style[category.style.length - 1];

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Style added successfully",
      data: {
        style: addedStyle, // Return the full style object
      },
    });
  },
};

const updateStyle = {
  handler: async (req, res) => {
    const { id, styleId } = req.params;
    const { name } = req.body;

    // Find category
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    // Find style by ID
    const style = category.style.id(styleId);
    if (!style) {
      throw new ApiError(httpStatus.NOT_FOUND, "Style not found");
    }

    // Check for duplicate style name (case-insensitive), excluding current style
    const isDuplicate = category.style.some(
      (s) =>
        s._id.toString() !== styleId &&
        s.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Style with this name already exists");
    }

    // Handle image upload
    let image = req.files?.image ? await saveFile(req.files.image) : null;

    // Remove old image if new one uploaded
    if (image && style.image) {
      await removeFile(style.image);
    }

    // Update style fields
    style.name = name || style.name;
    style.image = image?.upload_path || style.image;

    await category.save();

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Style updated successfully",
      data: style,
    });
  },
};

const getStyle = {
  handler: async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    return res.status(httpStatus.OK).json({
      success: true,
      subcategories: category.style || [],
    });
  },
}

const deleteStyle = {
  handler: async (req, res) => {
    const { id, styleId } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }
    const styleIndex = category.style.findIndex(
      (style) => style._id.toString() === styleId
    );

    if (styleIndex === -1) {
      throw new ApiError(httpStatus.NOT_FOUND, "Style not found");
    }

    category.style.splice(styleIndex, 1);
    await category.save();


    return res.status(httpStatus.OK).json({
      success: true,
      message: "Style deleted successfully",
    });
  },
};

module.exports = {
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  getSubcategories,
  deleteSubcategory,
  updateSubcategory,
  addStyle,
  updateStyle,
  getStyle,
  deleteStyle
};
