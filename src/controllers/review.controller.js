const Joi = require("joi");
const Review = require("../models/review.model");
const httpStatus = require("http-status");
const { saveFile } = require("../utils/helper");
const Products = require("../models/products.modal");
const ApiError = require("../utils/ApiError");
const createReviewPro = {
  validation: {
    body: Joi.object().keys({
         image: Joi.array().items(Joi.string()).optional(),
      msg: Joi.string().required(),
      productId: Joi.string().required(),
      userId: Joi.string().required(),
      rating: Joi.number().min(1).max(5).required(),
    }),
  },
  handler: async (req, res) => {
    try {
      const { productId, msg, rating,userId } = req.body;

      const product = await Products.findById(productId);
      if (!product) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid productId");
      }

      let imagePath = [];
      if (req.files && req.files.image) {
        const filesArray = Array.isArray(req.files.image)
          ? req.files.image
          : [req.files.image];
      
        for (const file of filesArray) {
          const { upload_path } = await saveFile(file); // make sure saveFile works as expected
          imagePath.push(upload_path);
        }
      }
      
      const reviewData = {
        msg,
        rating,
        productId,
        image: imagePath,
        userId,
      };

      const review = await new Review(reviewData).save();
      return res.status(httpStatus.CREATED).send(review);
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: error.message });
    }
  },
};

const getReviewsByProductId = {
  handler: async (req, res) => {
    try {
      const { productId } = req.params;

      // Find all reviews for the specified product
      const reviews = await Review.find({ productId });

      if (!reviews || reviews.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "No reviews found for this product");
      }

      // Get the review with the highest rating
      const topReview = reviews.reduce((max, review) => {
        return review.rating > max.rating ? review : max;
      }, reviews[0]);

      return res.status(httpStatus.OK).send(topReview); // only top-rated review
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: error.message });
    }
  },
};


const getAllReviews = {
  handler: async (req, res) => {
    try {
      // Find all reviews in the database
      const reviews = await Review.find().populate({
        path: "userId",
        select: "name email", // adjust fields as needed
      });

      if (!reviews || reviews.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "No reviews found");
      }

      return res.status(httpStatus.OK).send(reviews);
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: error.message });
    }
  },
};

module.exports = {
  createReviewPro,
  getReviewsByProductId,
  getAllReviews,
};
