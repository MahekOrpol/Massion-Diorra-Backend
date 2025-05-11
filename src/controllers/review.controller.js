const httpStatus = require("http-status");
const Joi = require("joi");
const { Review } = require("../models/review.model");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");

const createReview = {
  validation: {
    body: Joi.object().keys({
      product: Joi.string().required(),
      user: Joi.string().required(),
      rating: Joi.number().min(1).max(5).required(),
      comment: Joi.string().allow("", null),
    }),
  },
  handler: catchAsync(async (req, res) => {
    const review = await new Review(req.body).save();
    return res.status(httpStatus.CREATED).send(review);
  }),
};

const updateReview = {
  validation: {
    body: Joi.object().keys({
      rating: Joi.number().min(1).max(5),
      comment: Joi.string(),
      isVisible: Joi.boolean(),
    }),
  },
  handler: catchAsync(async (req, res) => {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!review) {
      throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }
    return res.send(review);
  }),
};

const deleteReview = {
  handler: catchAsync(async (req, res) => {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }
    return res.send(review);
  }),
};

const getReviews = {
  handler: catchAsync(async (req, res) => {
    const { product, user, page = 1, limit = 5 } = req.query;
    const filter = {};
    if (product) filter.product = product;
    if (user) filter.user = user;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate("user", "name")
      .populate("product", "name")
      .sort({ rating: -1, createdAt: -1 }) // top-rated, newest first
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    return res.send({
      page: parseInt(page),
      limit: parseInt(limit),
      totalReviews: total,
      reviews,
    });
  }),
};

const getReviewStats = {
  handler: catchAsync(async (req, res) => {
    const { product } = req.query;
    if (!product) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Product ID is required");
    }

    const stats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(product),
          isVisible: true,
        },
      },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (!stats.length) {
      return res.send({ averageRating: 0, totalReviews: 0 });
    }

    return res.send(stats[0]);
  }),
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getReviews,
  getReviewStats,
};
