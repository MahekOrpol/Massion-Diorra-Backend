const httpStatus = require("http-status");
const Joi = require("joi");
const Banner = require("../models/banner.model");
const ApiError = require("../utils/ApiError");

const createBanner = {
  validation: {
    body: Joi.object().keys({
      link: Joi.string().required(),
      bannerText: Joi.string().required(),
      isActive: Joi.boolean().default(true),
    }),
  },
  handler: async (req, res) => {
    const banner = await new Banner(req.body).save();
    return res.status(httpStatus.CREATED).send(banner);
  },
};

const updateBanner = {
  validation: {
    body: Joi.object().keys({
      link: Joi.string().allow("", null),
      bannerText: Joi.string().required(),
      isActive: Joi.boolean().default(true),
    }),
  },
  handler: async (req, res) => {
    const banner = await Banner.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    if (!banner) {
      throw new ApiError(httpStatus.NOT_FOUND, "Banner not found");
    }
    return res.send(banner);
  },
};

const deleteBanner = {
  handler: async (req, res) => {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      throw new ApiError(httpStatus.NOT_FOUND, "Banner not found");
    }
    return res.status(httpStatus.OK).send(banner);
  },
};

// Get Banners (Paginated, Filtered by `active`)
const getBanners = {
  handler: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = limit * (page - 1);

    const banners = await Banner.find({
      ...(req.query.isActive
        ? { isActive: req.query.isActive === "true" }
        : {}),
    })
      .sort({ order: 1 })
      .limit(limit)
      .skip(skip);

    return res.status(httpStatus.OK).send(banners);
  },
};

module.exports = {
  createBanner,
  updateBanner,
  deleteBanner,
  getBanners,
};
