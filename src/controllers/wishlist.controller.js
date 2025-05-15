const httpStatus = require("http-status");
const Wishlist = require("../models/wishlist.modal");
const Products = require("../models/products.modal");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");

const createWishlist = catchAsync(async (req, res) => {
  const { userId, productId, selectedMetal } = req.body;

  // Find product with variations
  const product = await Products.findById(productId).populate('variations');
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }
  // Find the selected metal variation
  let selectedMetalVariation = null;
  let selectedDiamondShape = null;
  let selectedShank = null;

  for (const variation of product.variations) {
    if (variation.metalVariations) {
      for (const mv of variation.metalVariations) {
        if (mv.metal === selectedMetal) {
          selectedMetalVariation = mv;
          selectedDiamondShape = mv.diamondShape;
          selectedShank = mv.shank;
          
          break;
        }
      }
    }
    if (selectedMetalVariation) break;
  }

  if (!selectedMetalVariation) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Selected metal variation not found");
  }


  // Check if already in wishlist
  const existingWishlist = await Wishlist.findOne({
    userId,
    productId,
    selectedMetal
  });

  if (existingWishlist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product with these specifications already in wishlist");
  }

  // Create wishlist item
  const wishlistItem = await Wishlist.create({
    userId,
    productId,
    selectedMetal,
    selectedDiamondShape,
    selectedShank,
  });

  return res.status(httpStatus.CREATED).json({
    message: "Product added to wishlist",
    data: wishlistItem
  });
});

const deleteeWishlist = catchAsync(async (req, res) => {
  const { id } = req.params;
  const wishlistItem = await Wishlist.findByIdAndDelete(id);
  
  if (!wishlistItem) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found in wishlist");
  }

  return res.status(httpStatus.OK).json({
    message: "Product removed from wishlist"
  });
});

const getWishlist = catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  const wishlistItems = await Wishlist.find({ userId })
    .populate({
      path: 'productId',
      populate: {
        path: 'variations',
        populate: {
          path: 'metalVariations'
        }
      }
    })
    .lean();

  // Enhance wishlist items with product details
  const enhancedWishlist = wishlistItems.map(item => {
    const product = item.productId;
    let thumbnail = null;
    let allImages = [];

    // Find the selected metal variation's images
    if (product.variations) {
      for (const variation of product.variations) {
        if (variation.metalVariations) {
          for (const mv of variation.metalVariations) {
            if (mv.metal === item.selectedMetal) {
              if (mv.images && mv.images.length > 0) {
                thumbnail = mv.images[0];
                allImages = mv.images;
              }
              break;
            }
          }
        }
        if (thumbnail) break;
      }
    }

    return {
      _id: item._id,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      selectedMetal: item.selectedMetal,
      selectedSize: item.selectedSize,
      selectedDiamondShape: item.selectedDiamondShape,
      selectedShank: item.selectedShank,
      price: item.price,
      product: {
        _id: product._id,
        productName: product.productName,
        productsDescription: product.productsDescription,
        categoryName: product.categoryName,
        gender: product.gender,
        best_selling: product.best_selling,
        sku: product.sku,
        stock: product.stock,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        discount: product.discount,
        thumbnail,
        images: allImages,
        variations: product.variations
      }
    };
  });

  return res.status(httpStatus.OK).json({
    message: "User wishlist retrieved",
    data: enhancedWishlist
  });
});

const getAllWishlists = catchAsync(async (req, res) => {
  const wishlistItems = await Wishlist.find()
    .populate({
      path: 'productId',
      populate: {
        path: 'variations',
        populate: {
          path: 'metalVariations'
        }
      }
    })
    .populate('userId', 'name email')
    .lean();

  // Enhance wishlist items with product details
  const enhancedWishlist = wishlistItems.map(item => {
    const product = item.productId;
    let thumbnail = null;
    let allImages = [];

    // Find the selected metal variation's images
    if (product.variations) {
      for (const variation of product.variations) {
        if (variation.metalVariations) {
          for (const mv of variation.metalVariations) {
            if (mv.metal === item.selectedMetal) {
              if (mv.images && mv.images.length > 0) {
                thumbnail = mv.images[0];
                allImages = mv.images;
              }
              break;
            }
          }
        }
        if (thumbnail) break;
      }
    }

    return {
      _id: item._id,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      user: item.userId,
      userId: item.userId?._id || item.userId,
      selectedMetal: item.selectedMetal,
      selectedSize: item.selectedSize,
      selectedDiamondShape: item.selectedDiamondShape,
      selectedShank: item.selectedShank,
      price: item.price,
      product: {
        _id: product._id,
        productName: product.productName,
        productsDescription: product.productsDescription,
        categoryName: product.categoryName,
        gender: product.gender,
        best_selling: product.best_selling,
        sku: product.sku,
        stock: product.stock,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        discount: product.discount,
        thumbnail,
        images: allImages,
        variations: product.variations
      }
    };
  });

  return res.status(httpStatus.OK).json({
    message: "All wishlists retrieved successfully",
    data: enhancedWishlist
  });
});

module.exports = {
  getAllWishlists,
  createWishlist,
  deleteeWishlist,
  getWishlist
};
