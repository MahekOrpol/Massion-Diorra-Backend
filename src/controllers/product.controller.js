const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const {
  authService,
  userService,
  tokenService,
  emailService,
} = require("../services");
const Joi = require("joi");
const { password } = require("../validations/custom.validation");
const { Products, ProductVariations, Game } = require("../models");
const ApiError = require("../utils/ApiError");
const { saveFile, removeFile } = require("../utils/helper");
const { log } = require("../config/logger");

const createProduct = {
  validation: {
    body: Joi.object()
      .keys({
        categoryName: Joi.string().required(),
        quantity: Joi.string().required(),
        productName: Joi.string().required(),
        productsDescription: Joi.string().required(),
        regularPrice: Joi.number().precision(2).required(),
        salePrice: Joi.number().precision(2).required(),
        discount: Joi.number().precision(2),
        stock: Joi.string().required(),
        productSize: Joi.alternatives()
          .try(Joi.array().items(Joi.string()), Joi.string())
          .required(), // Accept array or string
        review: Joi.string(),
        rating: Joi.string(),
        sku: Joi.string().required(),
        best_selling: Joi.string(),
        image: Joi.array().items(Joi.string()).optional(),
        gender: Joi.string(),
        hasVariations: Joi.boolean().default(false),
        variations: Joi.alternatives()
          .try(
            Joi.array().items(
              Joi.object({
                productSize: Joi.string().required(),
                regularPrice: Joi.number().precision(2).required(),
                salePrice: Joi.number().precision(2).required(),
                discount: Joi.number().precision(2).optional(),
              })
            ),
            Joi.string() // Allow JSON string
          )
          .optional(),
      })
      .custom((value, helpers) => {
        if (value.salePrice > value.regularPrice) {
          return helpers.error(
            "Sale price cannot be greater than regular price"
          );
        }
        return value;
      }),
  },
  handler: async (req, res) => {
    console.log("req.body :>> ", req.body);
    let {
      categoryName,
      quantity,
      productName,
      productsDescription,
      regularPrice,
      salePrice,
      discount,
      stock,
      productSize,
      review,
      rating,
      sku,
      best_selling,
      image,
      gender,
      hasVariations,
      variations
    } = req.body;


    hasVariations = String(hasVariations).trim().toLowerCase() === "true";

    console.log('String(hasVariations).trim().toLowerCase() === true',   String(hasVariations).trim().toLowerCase() === "true")

    if (hasVariations && typeof variations === "string") { 
      variations = JSON.parse(variations);
    } else {
      variations = [];
    }
    console.log('typeof variations', typeof variations)

    // check if Product already exists
    const productsNameExits = await Products.findOne({
      productName: req.body.productName,
    });
    const productsskuExits = await Products.findOne({
      sku: req.body.sku,
    });
    if (productsNameExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Products already exists");
    }
    if (productsskuExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "SKU already exists");
    }

    let imagePaths = [];
    if (req.files && req.files.image) {
      // If single file, wrap in array
      const filesArray = Array.isArray(req.files.image)
        ? req.files.image
        : [req.files.image];

      for (const file of filesArray) {
        const { upload_path } = await saveFile(file);
        imagePaths.push(upload_path);
      }
    }
    req.body.image = imagePaths;

    best_selling = best_selling === "1" ? "1" : "0";

    discount = parseFloat(discount);
    salePrice = parseFloat(salePrice);
    regularPrice = parseFloat(regularPrice);

    if (typeof req.body.productSize === "string") {
      req.body.productSize = req.body.productSize
        .split(",")
        .map((size) => size.trim()); // Convert comma-separated string to array
    }

    if (isNaN(req.body.discount)) {
      req.body.discount = 0;
    }

    const product = new Products({
      productName,
      productsDescription,
      categoryName,
      image:imagePaths,
      regularPrice,
      salePrice,
      discount: discount || 0,
      stock,
      productSize,
      review: review || "",
      rating: rating || "0",
      sku,
      best_selling: best_selling || "0",
      gender,
      quantity,
      hasVariations
    });
    

    if (hasVariations && Array.isArray(variations) && variations.length > 0) {
      const variationDocs = variations.map(variation => ({
        productId: product._id,
        productSize: variation.productSize,
        regularPrice: variation.regularPrice || 0, 
        salePrice: variation.salePrice,
        discount: variation.discount || 0
      }));

      console.log('variationDocs', variationDocs)
      const savedVariations = await ProductVariations.insertMany(variationDocs);
      product.variations = savedVariations.map(variation => variation._id);
      await product.save();
    }

    const products = await product.save();


    const newProduct  =  await Products.findById(products._id).populate('variations');
    return res.status(httpStatus.CREATED).send(newProduct);
  },
};

const getAllProducts = {
  validation: {
    body: Joi.object().keys({
      categoryName: Joi.string(),
      productName: Joi.string(),
      stock: Joi.string(),
      gender: Joi.string(),
      salePrice:Joi.string()
    }),
  },
  handler: async (req, res) => {
    // const products = await Products.find({
    //   ...(req.query?.productName && { productName: req.query?.productName }),
    // });
    // return res.status(httpStatus.OK).send(products);
    const filter = {};

    if (req.query?.categoryName) {
      filter.categoryName = req.query.categoryName; // Filter by category name
    }

    if (req.query?.productName) {
      filter.productName = req.query.productName; // Filter by product namenpm
    }

    if (req.query?.stock) {
      filter.stock = req.query.stock; // Filter by product name
    }
    if (req.query?.gender) {
      filter.gender = req.query.gender; // Filter by product name
    }
    if (req.query?.salePrice) {
      const maxPrice = parseFloat(req.query.salePrice);
      if (!isNaN(maxPrice)) {
        filter.salePrice = { $gte: 0, $lte: maxPrice };
      }
    }
   

    const products = await Products.find(filter).populate('variations');

    return res.status(httpStatus.OK).send(products);
  },
};

const getLatestProductsByCategory = {
  validation: {
    body: Joi.object().keys({
      categoryName: Joi.string(),
    }),
  },
  handler: async (req, res) => {
    try {
      const filter = {};

      if (req.query?.categoryName) {
        filter.categoryName = req.query.categoryName;  
      }

      const products = await Products.find(filter)
        .sort({ createdAt: -1 }) // Sort by createdAt (latest first)
        
        .populate('variations');

      return res.status(httpStatus.OK).send(products);
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Error fetching products', error });
    }
  },
};

const getTrendingProducts = {
  validation: {
    body: Joi.object().keys({
      categoryName: Joi.string().required(),
      productName: Joi.string().required(),
      productsDescription: Joi.string().required(),
      regularPrice: Joi.number().precision(2).required(),
      salePrice: Joi.number().precision(2).required(),
      discount: Joi.number().precision(2),
      stock: Joi.string().required(),
      productSize: Joi.alternatives()
        .try(Joi.array().items(Joi.string()), Joi.string())
        .required(),
      review: Joi.string(),
      rating: Joi.string(), // Ensure rating is a number
      sku: Joi.string().required(),
      image: Joi.string(),
    }),
  },
  handler: async (req, res) => {
    try {
      // const products = await Products.aggregate([
      //   {
      //     $addFields: {
      //       numericRating: { $toDouble: "$rating" } // Convert string rating to number
      //     }
      //   },
      //   { $sort: { numericRating: -1 } },
      //   { $limit: 4 }
      // ]);

      const products = await Products.find()
        .sort({ rating: -1 }) // Sort by highest rating
        // .limit(4).populate('variations'); // Get only the top 4 products

      return res.status(httpStatus.OK).send(products);
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong",
        error: error.message,
      });
    }
  },
};

const getProductsByPrice = {
  handler: async (req, res) => {
    try {
      const maxPrice = req.query.salePrice
        ? parseFloat(req.query.salePrice)
        : 1999; // Default: ₹1,999

      const products = await Products.find({ salePrice: { $lt: maxPrice } }).populate('variations') // Filter products by salePrice
        .sort({ rating: -1 }); // Sort by highest rating

      return res.status(httpStatus.OK).json(products);
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong",
        error: error.message,
      });
    }
  },
};

const getBestSelling = {
  validation: {
    query: Joi.object().keys({
      best_selling: Joi.string().valid("1"), // Only allow "1" as a valid value
    }),
  },
  handler: async (req, res) => {
    try {
      const bestSellingProducts = await Products.find({ best_selling: "1" }).populate('variations');

      return res.status(httpStatus.OK).send(bestSellingProducts);
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: "Error fetching best-selling products",
        error: error.message,
      });
    }
  },
};

const getOnSale = {
  handler: async (req, res) => {
    try {
      const onSaleProducts = await Products.find({ discount: { $gt: 0 } }) // Get products with discount > 0
        .sort({ discount: -1 }) // Sort by highest discount first
        // .limit(4).populate('variations'); // Limit to 4 products

      return res.status(httpStatus.OK).json(onSaleProducts);
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  },
};

const updateProducts = {
  handler: async (req, res) => {
    const { _id } = req.params;

    let product = await Products.findById(_id).populate("variations");
    if (!product) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Product not found");
    }

    // Check if product name already exists for a different product
    const productsWithNameExists = await Products.findOne({
      productName: req.body?.productName,
      _id: { $ne: _id },
    }).exec();

    if (productsWithNameExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Product name already exists");
    }

    // Process image uploads
    let imagePaths = product.image || [];
    if (req.files && req.files.image) {
      const filesArray = Array.isArray(req.files.image)
        ? req.files.image
        : [req.files.image];

      for (const file of filesArray) {
        const { upload_path } = await saveFile(file);
        imagePaths.push(upload_path);
      }
    }
    req.body.image = imagePaths;

    // Type conversions
    req.body.discount = parseFloat(req.body.discount) || 0;
    req.body.salePrice = parseFloat(req.body.salePrice);
    req.body.regularPrice = parseFloat(req.body.regularPrice);

    // Convert productSize string to array
    if (typeof req.body.productSize === "string") {
      req.body.productSize = req.body.productSize
        .split(",")
        .map((size) => size.trim());
    }

    // Handle variations
    let { hasVariations, variations } = req.body;
    hasVariations = String(hasVariations).trim().toLowerCase() === "true";

    if (hasVariations) {
      if (typeof variations === "string") {
        try {
          variations = JSON.parse(variations);
        } catch (error) {
          return res.status(400).json({ message: "Invalid variations format" });
        }
      }

      if (!Array.isArray(variations)) {
        return res.status(400).json({ message: "Variations must be an array" });
      }

      // Validate variation fields
      for (const variation of variations) {
        if (
          !variation.productSize ||
          variation.salePrice == null ||
          variation.regularPrice == null
        ) {
          return res.status(400).json({ message: "Variation missing required fields" });
        }
      }

      req.body.variations = variations;

      // Track variations
      const existingVariationIds = product.variations.map((v) => v._id.toString());
      const newVariationDocs = [];

      for (const variation of variations) {
        if (variation._id && existingVariationIds.includes(variation._id)) {
          await ProductVariations.findByIdAndUpdate(variation._id, variation);
        } else {
          newVariationDocs.push({
            productId: product._id,
            productSize: variation.productSize,
            regularPrice: parseFloat(variation.regularPrice) || 0,
            salePrice: parseFloat(variation.salePrice) || 0,
            discount: parseFloat(variation.discount) || 0,
          });
        }
      }

      // Save new variations
      const savedVariations = await ProductVariations.insertMany(newVariationDocs);
      const newVariationIds = savedVariations.map((v) => v._id.toString());
      const existingVariationIdsToKeep = variations
        .map((v) => v._id)
        .filter((id) => id && existingVariationIds.includes(id));

      const updatedVariationIds = [...existingVariationIdsToKeep, ...newVariationIds];

      // Remove deleted variations
      const variationsToDelete = existingVariationIds.filter(
        (id) => !updatedVariationIds.includes(id)
      );

      if (variationsToDelete.length > 0) {
        await ProductVariations.deleteMany({ _id: { $in: variationsToDelete } });
      }

      product.variations = updatedVariationIds;
    } else {
      // No variations - delete all
      await ProductVariations.deleteMany({ productId: product._id });
      product.variations = [];
    }

    // Update allowed fields only
    const fieldsToUpdate = [
      "productName",
      "productsDescription",
      "regularPrice",
      "salePrice",
      "stock",
      "gender",
      "discount",
      "best_selling",
      "sku",
      "quantity",
      "categoryName",
      "productSize",
      "image"
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    const updatedProduct = await Products.findById(_id).populate("variations");
    return res.status(httpStatus.OK).send(updatedProduct);
  },
};



const deleteProduct = {
  handler: async (req, res) => {
    const { _id } = req.params;

    const productExits = await Products.findOne({ _id });
    if (!productExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Products not found");
    }

    // delete old image
    if (Array.isArray(productExits.image)) {
      for (const imgPath of productExits.image) {
        if (imgPath) await removeFile(imgPath);
      }
    } else if (productExits.image) {
      await removeFile(productExits.image);
    }

    // delete Products
    await Products.deleteOne({ _id });
    await ProductVariations.deleteMany({ productId: _id })
    return res
      .status(httpStatus.OK)
      .send({ message: "Products deleted successfully" });
  },
};

const multiDeleteProducts = {
  validation: {
    body: Joi.object().keys({
      ids: Joi.array().items(Joi.string().required()).required(),
    }),
  },
  handler: async (req, res) => {
    const { ids } = req.body;
    const parsedIds = typeof ids === "string" ? ids.split(",") : ids;

    if (!Array.isArray(parsedIds) || parsedIds.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No product IDs provided");
    }

    // Fetch products to remove their images
    const products = await Products.find({ _id: { $in: ids } });

    console.log('products', products)

    if (!products || products.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Products not found");
    }

    // for (const product of products) {
    //   if (Array.isArray(product.image)) {
    //     for (const img of product.image) {
    //       if (img) await removeFile(img);
    //     }
    //   } else if (product.image) {
    //     await removeFile(product.image);
    //   }
    // }

    // Remove associated images
    // for (const product of products) {
    //   if (product?.image) {
    //     await removeFile(product.image);
    //   }
    // }

    console.log('ids', ids)

    // Delete products from DB
    await Products.deleteMany({ _id: { $in: ids } });
    await ProductVariations.deleteMany({ productId: { $in: ids } })
    return res
      .status(httpStatus.OK)
      .send({ message: "Products deleted successfully" });
  },
};

const getSingleProduct = {
  validation: {
    params: Joi.object().keys({
      productId: Joi.string().required(), // Validate productId from params
    }),
  },
  handler: async (req, res) => {
    const { productId } = req.params;

    // Check if product exists
    const product = await Products.findById(productId).populate('variations');

    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    return res.status(httpStatus.OK).send(product);
  },
};

const getProductById = {
  validation: {
    params: Joi.object().keys({
      id: Joi.string().required(), // Validate ID from params
    }),
  },
  handler: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Products.findById(id).populate('variations');

      if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
      }

      return res.status(httpStatus.OK).send(product);
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: "Error fetching product",
        error: error.message,
      });
    }
  },
};

module.exports = {
  createProduct,
  getAllProducts,
  getTrendingProducts,
  updateProducts,
  deleteProduct,
  getBestSelling,
  getOnSale,
  getSingleProduct,
  multiDeleteProducts,
  getProductsByPrice,
  getProductById,
  getLatestProductsByCategory
};
