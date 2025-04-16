const httpStatus = require("http-status");
const Wishlist = require("../models/wishlist.modal");
const Products = require("../models/products.modal");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");


const createWishlist = catchAsync(
  async (req, res) => {
    const { userId, productId } = req.body;
    const product = await Products.findById(productId);
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    const existingWishlist = await Wishlist.findOne({ userId, productId });
    if (existingWishlist) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product already in wishlist"
      );
    }

    const wishlistItem = await Wishlist.create({ userId, productId });
    return res.status(httpStatus.CREATED).json({
      message: "Product added to wishlist",
      data: wishlistItem,
    });
  }
)

const deleteeWishlist = catchAsync(
  async (req, res) => {
    const {id} = req.params;
    const wishlistItem = await Wishlist.findByIdAndDelete(id)
    if (!wishlistItem) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Product not found in wishlist"
      );
    }

    return res.status(httpStatus.OK).json({
      message: "Product removed from wishlist",
    });
  }
)



const getWishlist = async (req, res) => {
  const { userId } = req.params;
      const wishlistItems = await Wishlist.find({ userId }).populate(
        "productId",
        "productName salePrice image regularPrice productSize"
      );

      return res.status(httpStatus.OK).json({
        message: "User wishlist retrieved",
        data: wishlistItems,
      });
};

const getAllWishlists = async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find()
      .populate('productId', 'productName salePrice image categoryName productSize')
      .populate('userId', 'name email')  // ✅ Populate user details
      .lean();

    // Optional: Rename 'userId' to 'user' in the response
    const formattedWishlist = wishlistItems.map((item) => ({
      ...item,
      user: item.userId,
      userId: item.userId?._id || item.userId,  // Keeps userId in case you need it
    }));

    return res.status(httpStatus.OK).json({
      message: "All wishlists retrieved successfully",
      data: formattedWishlist,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};



module.exports = {
  getAllWishlists,
  createWishlist,
  deleteeWishlist,
  getWishlist
};
