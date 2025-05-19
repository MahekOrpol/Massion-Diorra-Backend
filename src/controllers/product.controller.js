const httpStatus = require("http-status");
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
        productName: Joi.string().required(),
        productsDescription: Joi.string().required(),
        regularPrice: Joi.number().precision(2).required(),
        salePrice: Joi.number().precision(2).required(),
        discount: Joi.number().precision(2),
        stock: Joi.string().required(),
        sku: Joi.string().required(),
        best_selling: Joi.string(),
        gender: Joi.string(),
        hasVariations: Joi.boolean().default(false),
        variations: Joi.alternatives()
          .try(
            Joi.array().items(
              Joi.object({
                metalVariations: Joi.array()
                  .items(
                    Joi.object({
                      metal: Joi.string().required(),
                      quantity: Joi.string().required(),
                      images: Joi.array().items(Joi.string()).required(),
                      diamondShape: Joi.object({
                        name: Joi.array().items(Joi.string()).required(),
                        image: Joi.string().required(),
                      }).required(),
                      shank: Joi.object({
                        name: Joi.array().items(Joi.string()).required(),
                        image: Joi.string().required(),
                      }).required(),
                      ringSizes: Joi.array()
                        .items(
                          Joi.object({
                            productSize: Joi.string().required(),
                            regularPrice: Joi.number().precision(2).required(),
                            salePrice: Joi.number().precision(2).required(),
                            quantity: Joi.number().required(),
                          })
                        )
                        .required(),
                    })
                  )
                  .required(),
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
      productName,
      productsDescription,
      regularPrice,
      salePrice,
      discount,
      stock,
      sku,
      best_selling,
      gender,
      hasVariations,
      variations,
    } = req.body;

    hasVariations = String(hasVariations).trim().toLowerCase() === "true";

    if (hasVariations && typeof variations === "string") {
      variations = JSON.parse(variations);
    } else {
      variations = [];
    }

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

    best_selling = best_selling === "1" ? "1" : "0";

    discount = parseFloat(discount);
    salePrice = parseFloat(salePrice);
    regularPrice = parseFloat(regularPrice);

    if (isNaN(req.body.discount)) {
      req.body.discount = 0;
    }

    const product = new Products({
      productName,
      productsDescription,
      categoryName,
      regularPrice,
      salePrice,
      discount: discount || 0,
      stock,
      review: "",
      rating: "0",
      sku,
      best_selling: best_selling || "0",
      gender,
      hasVariations,
    });

    if (hasVariations && Array.isArray(variations) && variations.length > 0) {
      // Process images for each metal variation
      for (const variation of variations) {
        for (const metalVariation of variation.metalVariations) {
          const metalKey = metalVariation.metal.replace(/\s+/g, "_");
          if (req.files && req.files[`images_${metalKey}`]) {
            const filesArray = Array.isArray(req.files[`images_${metalKey}`])
              ? req.files[`images_${metalKey}`]
              : [req.files[`images_${metalKey}`]];

            const imagePaths = [];
            for (const file of filesArray) {
              const { upload_path } = await saveFile(file);
              imagePaths.push(upload_path);
            }
            metalVariation.images = imagePaths;
          }
        }
      }

      const variationDocs = variations.map((variation) => ({
        productId: product._id,
        metalVariations: variation.metalVariations,
      }));

      const savedVariations = await ProductVariations.insertMany(variationDocs);
      product.variations = savedVariations.map((variation) => variation._id);
      await product.save();
    }

    const products = await product.save();
    const newProduct = await Products.findById(products._id).populate(
      "variations"
    );
    return res.status(httpStatus.CREATED).send(newProduct);
  },
};

const getAllProducts = {
  validation: {
    query: Joi.object().keys({
      categoryName: Joi.string(),
      productName: Joi.string(),
      stock: Joi.string(),
      gender: Joi.string(),
      salePrice: Joi.string(),
      metal: Joi.string(), // e.g., "Gold,Platinum"
      best_selling: Joi.string(),
      hasVariations: Joi.boolean(),
      diamondShape: Joi.string(),
    }),
  },
  handler: async (req, res) => {
    try {
      const filter = {};

      // Basic filters
      if (req.query?.categoryName) {
        filter.categoryName = req.query.categoryName;
      }

      if (req.query?.productName) {
        filter.productName = { $regex: req.query.productName, $options: "i" };
      }

      if (req.query?.stock) {
        filter.stock = req.query.stock;
      }

      if (req.query?.gender) {
        filter.gender = req.query.gender;
      }

      if (req.query?.best_selling) {
        filter.best_selling = req.query.best_selling;
      }

      if (req.query?.hasVariations !== undefined) {
        filter.hasVariations = req.query.hasVariations === "true";
      }

      // Price filter
      if (req.query?.salePrice) {
        const maxPrice = parseFloat(req.query.salePrice);
        if (!isNaN(maxPrice)) {
          filter.salePrice = { $gte: 0, $lte: maxPrice };
        }
      }

      // Parse metals from query
      const metalArray = req.query?.metal
        ? req.query.metal.split(",").map((m) => m.trim())
        : [];

        const diamondArray = req.query.diamondShape
        ? req.query.diamondShape.split(",").map(d => d.trim())
        : [];

      // Fetch products with populated variations and matched metalVariations
      const products = await Products.find(filter)
        .populate({
          path: "variations",
          populate: {
            path: "metalVariations",
            match:
            metalArray.length > 0 || diamondArray.length > 0
              ? {
                  ...(metalArray.length > 0 && { metal: { $in: metalArray } }),
                  ...(diamondArray.length > 0 && {
                    "diamondShape.name": { $in: diamondArray },
                  }),
                }
              : {},
            // match: metalArray.length > 0 ? { metal: { $in: metalArray } } : {}, // only metal filter
          },
        })
        .lean();

      // Filter out products with no matching metal variations if metal filter applied
      let filteredProducts = products;

      if (metalArray.length > 0) {
        filteredProducts = products
          .map((product) => {
            // Keep only variations that have matching metalVariations
            const filteredVariations = product.variations
            .map((variation) => {
              const matchingMetalVariations = (variation.metalVariations || []).filter((mv) => {
                const metalMatch = metalArray.length === 0 || metalArray.includes(mv.metal);
                const diamondMatch =
                  diamondArray.length === 0 ||
                  (mv.diamondShape || []).some((ds) => diamondArray.includes(ds.name));
                return metalMatch && diamondMatch;
              });
          
              return matchingMetalVariations.length > 0
                ? { ...variation, metalVariations: matchingMetalVariations }
                : null;
            })
            .filter(Boolean); // remove nulls
          
      
            // Only include product if it has at least one valid variation
            if (filteredVariations.length > 0) {
              return { ...product, variations: filteredVariations };
            }
            return null;
          })
          .filter(Boolean);
      }
          

      // Enhance response
      const enhancedProducts = filteredProducts.map((product) => {
        const validVariations = product.variations.filter(
          (v) => v.metalVariations && v.metalVariations.length > 0
        );

        const allMetals = validVariations.reduce((metals, variation) => {
          variation.metalVariations.forEach((mv) => {
            if (!metals.includes(mv.metal)) {
              metals.push(mv.metal);
            }
          });
          return metals;
        }, []);

        const allRingSizes = validVariations.reduce((sizes, variation) => {
          variation.metalVariations.forEach((mv) => {
            mv.ringSizes.forEach((rs) => {
              if (!sizes.includes(rs.productSize)) {
                sizes.push(rs.productSize);
              }
            });
          });
          return sizes;
        }, []);

        const allPrices = validVariations.flatMap((variation) =>
          variation.metalVariations.flatMap((mv) =>
            mv.ringSizes?.map((rs) => parseFloat(rs.salePrice)) || []
          )
        );

        return {
          ...product,
          availableMetals: allMetals,
          availableRingSizes: allRingSizes,
          priceRange: {
            min: Math.min(...allPrices),
            max: Math.max(...allPrices),
          },
        };
      });

      return res.status(httpStatus.OK).send(enhancedProducts);
    } catch (error) {
      console.error("Error in getAllProducts:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: "Error fetching products",
        error: error.message,
      });
    }
  },
};

const getLatestProductsByCategory = {
  validation: {
    query: Joi.object().keys({
      categoryName: Joi.string().required(),
      limit: Joi.number().integer().min(1).max(50).default(10),
    }),
  },
  handler: async (req, res) => {
    try {
      const { categoryName, limit = 10, excludeProductId } = req.query;
      const filter = { categoryName };

      // Exclude current product if excludeProductId is provided
      if (excludeProductId) {
        filter._id = { $ne: excludeProductId };
      }

      const products = await Products.find(filter)
        .sort({ createdAt: -1 }) // Sort by latest first
        .limit(parseInt(limit))
        .populate({
          path: "variations",
          populate: {
            path: "metalVariations",
          },
        })
        .lean();

      // Enhance products with additional information
      const enhancedProducts = products.map((product) => {
        // Get all unique metals from variations
        const allMetals = product.variations.reduce((metals, variation) => {
          if (variation.metalVariations) {
            variation.metalVariations.forEach((mv) => {
              if (!metals.includes(mv.metal)) {
                metals.push(mv.metal);
              }
            });
          }
          return metals;
        }, []);

        // Get price range
        const priceRange = {
          min: Math.min(
            ...product.variations.reduce((prices, variation) => {
              if (variation.metalVariations) {
                variation.metalVariations.forEach((mv) => {
                  mv.ringSizes.forEach((rs) => {
                    prices.push(parseFloat(rs.salePrice));
                  });
                });
              }
              return prices;
            }, [])
          ),
          max: Math.max(
            ...product.variations.reduce((prices, variation) => {
              if (variation.metalVariations) {
                variation.metalVariations.forEach((mv) => {
                  mv.ringSizes.forEach((rs) => {
                    prices.push(parseFloat(rs.salePrice));
                  });
                });
              }
              return prices;
            }, [])
          ),
        };

        // Get first metal variation's first image as product thumbnail
        const thumbnail =
          product.variations[0]?.metalVariations[0]?.images[0] || null;

        return {
          ...product,
          availableMetals: allMetals,
          priceRange,
          thumbnail,
        };
      });

      return res.status(httpStatus.OK).send(enhancedProducts);
    } catch (error) {
      console.error("Error in getLatestProductsByCategory:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: "Error fetching related products",
        error: error.message,
      });
    }
  },
};

const getTrendingProducts = {
  validation: {
    query: Joi.object().keys({
      limit: Joi.number().integer().min(1).max(50).default(10),
      categoryName: Joi.string().optional(),
    }),
  },
  handler: async (req, res) => {
    try {
      const { limit = 4, categoryName } = req.query;

      // Build filter object
      const filter = {};
      if (categoryName) {
        filter.categoryName = categoryName;
      }

      // Find products and sort by creation date
      const products = await Products.find(filter)
        .sort({ createdAt: -1 }) // Sort by latest first
        .limit(parseInt(limit))
        .populate({
          path: "variations",
          populate: {
            path: "metalVariations",
          },
        })
        .lean();

      if (!products || products.length === 0) {
        return res.status(httpStatus.OK).send({
          message: categoryName
            ? `No products found in category: ${categoryName}`
            : "No products found",
          products: [],
        });
      }

      // Enhance products with additional information
      const enhancedProducts = products.map((product) => {
        // Get all unique metals from variations
        const allMetals =
          product.variations?.reduce((metals, variation) => {
            if (variation?.metalVariations) {
              variation.metalVariations.forEach((mv) => {
                if (mv?.metal && !metals.includes(mv.metal)) {
                  metals.push(mv.metal);
                }
              });
            }
            return metals;
          }, []) || [];

        // Get price range
        const prices =
          product.variations?.reduce((prices, variation) => {
            if (variation?.metalVariations) {
              variation.metalVariations.forEach((mv) => {
                if (mv?.ringSizes) {
                  mv.ringSizes.forEach((rs) => {
                    if (rs?.salePrice) {
                      prices.push(parseFloat(rs.salePrice));
                    }
                  });
                }
              });
            }
            return prices;
          }, []) || [];

        const priceRange =
          prices.length > 0
            ? {
                min: Math.min(...prices),
                max: Math.max(...prices),
              }
            : { min: 0, max: 0 };

        // Get first metal variation's first image as product thumbnail
        let thumbnail = null;
        if (product.variations?.[0]?.metalVariations?.[0]?.images?.[0]) {
          thumbnail = product.variations[0].metalVariations[0].images[0];
        }

        return {
          ...product,
          availableMetals: allMetals,
          priceRange,
          thumbnail,
        };
      });

      return res.status(httpStatus.OK).send({
        message: categoryName
          ? `Latest products from category: ${categoryName}`
          : "Latest products",
        products: enhancedProducts,
      });
    } catch (error) {
      console.error("Error in getTrendingProducts:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: "Error fetching trending products",
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

      const products = await Products.find({ salePrice: { $lt: maxPrice } })
        .populate("variations") // Filter products by salePrice
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
      const bestSellingProducts = await Products.find({
        best_selling: "1",
      }).populate("variations");

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
        .sort({ discount: -1 }); // Sort by highest discount first
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

    // Type conversions
    req.body.discount = parseFloat(req.body.discount) || 0;
    req.body.salePrice = parseFloat(req.body.salePrice);
    req.body.regularPrice = parseFloat(req.body.regularPrice);

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

      // Process images for each metal variation
      for (const variation of variations) {
        for (const metalVariation of variation.metalVariations) {
          const metalKey = metalVariation.metal.replace(/\s+/g, "_"); // Convert spaces to underscores
          if (req.files && req.files[`images_${metalKey}`]) {
            const filesArray = Array.isArray(req.files[`images_${metalKey}`])
              ? req.files[`images_${metalKey}`]
              : [req.files[`images_${metalKey}`]];

            if (metalVariation.images && metalVariation.images.length > 0) {
              for (const oldImagePath of metalVariation.images) {
                await removeFile(oldImagePath); // Helper to delete old images
              }
            }

            const imagePaths = [];
            for (const file of filesArray) {
              const { upload_path } = await saveFile(file);
              imagePaths.push(upload_path);
            }
            metalVariation.images = imagePaths;
          }
        }
      }

      // Track variations
      const existingVariationIds = product.variations.map((v) =>
        v._id.toString()
      );
      const newVariationDocs = [];

      for (const variation of variations) {
        if (variation._id && existingVariationIds.includes(variation._id)) {
          // Update existing variation
          await ProductVariations.findByIdAndUpdate(variation._id, {
            metalVariations: variation.metalVariations,
          });
        } else {
          // Create new variation
          newVariationDocs.push({
            productId: product._id,
            metalVariations: variation.metalVariations,
          });
        }
      }

      // Save new variations
      const savedVariations = await ProductVariations.insertMany(
        newVariationDocs
      );
      const newVariationIds = savedVariations.map((v) => v._id.toString());
      const existingVariationIdsToKeep = variations
        .map((v) => v._id)
        .filter((id) => id && existingVariationIds.includes(id));

      const updatedVariationIds = [
        ...existingVariationIdsToKeep,
        ...newVariationIds,
      ];

      // Remove deleted variations
      const variationsToDelete = existingVariationIds.filter(
        (id) => !updatedVariationIds.includes(id)
      );

      if (variationsToDelete.length > 0) {
        await ProductVariations.deleteMany({
          _id: { $in: variationsToDelete },
        });
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
      "categoryName",
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
    try {
      const { _id } = req.params;

      // Find product with populated variations
      const product = await Products.findById(_id).populate("variations");
      if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
      }

      // Delete all images from metal variations
      if (product.variations && product.variations.length > 0) {
        for (const variation of product.variations) {
          if (
            variation.metalVariations &&
            variation.metalVariations.length > 0
          ) {
            for (const metalVariation of variation.metalVariations) {
              if (metalVariation.images && metalVariation.images.length > 0) {
                for (const imagePath of metalVariation.images) {
                  if (imagePath) {
                    await removeFile(imagePath);
                  }
                }
              }
            }
          }
        }
      }

      // Delete all variations
      await ProductVariations.deleteMany({ productId: _id });

      // Delete the product
      await Products.deleteOne({ _id });

      return res.status(httpStatus.OK).send({
        message: "Product and its variations deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: "Error deleting product",
        error: error.message,
      });
    }
  },
};

const multiDeleteProducts = {
  validation: {
    body: Joi.object().keys({
      ids: Joi.array().items(Joi.string().required()).required(),
    }),
  },
  handler: async (req, res) => {
    try {
      const { ids } = req.body;
      const parsedIds = typeof ids === "string" ? ids.split(",") : ids;

      if (!Array.isArray(parsedIds) || parsedIds.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No product IDs provided");
      }

      // Find products with populated variations
      const products = await Products.find({
        _id: { $in: parsedIds },
      }).populate("variations");

      if (!products || products.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "Products not found");
      }

      // Delete all images from metal variations
      for (const product of products) {
        if (product.variations && product.variations.length > 0) {
          for (const variation of product.variations) {
            if (
              variation.metalVariations &&
              variation.metalVariations.length > 0
            ) {
              for (const metalVariation of variation.metalVariations) {
                if (metalVariation.images && metalVariation.images.length > 0) {
                  for (const imagePath of metalVariation.images) {
                    if (imagePath) {
                      await removeFile(imagePath);
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Delete all variations
      await ProductVariations.deleteMany({ productId: { $in: parsedIds } });

      // Delete the products
      await Products.deleteMany({ _id: { $in: parsedIds } });

      return res.status(httpStatus.OK).send({
        message: `${products.length} products and their variations deleted successfully`,
      });
    } catch (error) {
      console.error("Error in multiDeleteProducts:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: "Error deleting products",
        error: error.message,
      });
    }
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
    const product = await Products.findById(productId).populate("variations");

    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    return res.status(httpStatus.OK).send(product);
  },
};

const getProductById = {
  validation: {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    try {
      const { id } = req.params;
      const { metal, metalVariationId, diamondShape, shank } = req.query; // <- Grab query params

      const product = await Products.findById(id)
        .populate({
          path: "variations",
          populate: {
            path: "metalVariations",
          },
        })
        .lean();

      if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
      }

      // Filter variations if metal or metalVariationId is provided
      if (metal || metalVariationId || diamondShape || shank) {
        product.variations = product.variations
          .map((variation) => {
            variation.metalVariations = variation.metalVariations
              .map((mv) => {
                // Check if metal, id match
                if (
                  (metal && mv.metal !== metal) ||
                  (metalVariationId && mv._id.toString() !== metalVariationId)
                ) {
                  return null;
                }

                // Match diamondShape from array
                const matchedDiamondShapes = diamondShape
                  ? mv.diamondShape?.filter((ds) => ds.name === diamondShape)
                  : mv.diamondShape;

                if (
                  diamondShape &&
                  (!matchedDiamondShapes || matchedDiamondShapes.length === 0)
                ) {
                  return null;
                }

                // Match shank from array
                const matchedShanks = shank
                  ? mv.shank?.filter((s) => s.name === shank)
                  : mv.shank;

                if (shank && (!matchedShanks || matchedShanks.length === 0)) {
                  return null;
                }

                // Return filtered metal variation
                return {
                  ...mv,
                  diamondShape: matchedDiamondShapes,
                  shank: matchedShanks,
                };
              })
              .filter(Boolean); // Remove nulls

            return variation;
          })
          .filter((variation) => variation.metalVariations.length > 0);
      }

      // Extract metadata (availableMetals, sizes, etc.)
      const allMetals = new Set();
      const allRingSizes = new Set();
      const allDiamondShapes = [];
      const allShankTypes = [];
      const allPrices = [];

      product.variations.forEach((variation) => {
        variation.metalVariations.forEach((mv) => {
          allMetals.add(mv.metal);
          mv.ringSizes.forEach((rs) => {
            allRingSizes.add(rs.productSize);
            allPrices.push(parseFloat(rs.salePrice));
          });

          if (mv.diamondShape && mv.diamondShape.length > 0) {
            allDiamondShapes.push(mv.diamondShape);
          }

          if (mv.shank && mv.shank.length > 0) {
            allShankTypes.push(mv.shank);
          }
        });
      });

      const priceRange = {
        min: allPrices.length ? Math.min(...allPrices) : 0,
        max: allPrices.length ? Math.max(...allPrices) : 0,
      };

      const metalVariationsMap = {};
      product.variations.forEach((variation) => {
        variation.metalVariations.forEach((mv) => {
          metalVariationsMap[mv.metal] = {
            metal: mv.metal,
            quantity: mv.quantity,
            images: mv.images,
            diamondShape: mv.diamondShape,
            shank: mv.shank,
            ringSizes: mv.ringSizes,
          };
        });
      });

      const enhancedProduct = {
        ...product,
        availableMetals: Array.from(allMetals),
        availableRingSizes: Array.from(allRingSizes),
        availableDiamondShapes: allDiamondShapes,
        availableShankTypes: allShankTypes,
        priceRange,
        metalVariations: metalVariationsMap,
      };

      return res.status(httpStatus.OK).send(enhancedProduct);
    } catch (error) {
      console.error("Error in getProductById:", error);
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
  getLatestProductsByCategory,
};
