const httpStatus = require("http-status");
const Joi = require("joi");
const ApiError = require("../utils/ApiError");
const Testimonial = require("../models/testimonial.model");

const createTestimonial = {
  validation: {
    body: Joi.object().keys({
      name: Joi.string().required(),
      message: Joi.string().required(),
      designation: Joi.string().allow("", null),
      company: Joi.string().allow("", null),
      image: Joi.string().allow("", null),
      isVisible: Joi.boolean(),
    }),
  },
  handler: async (req, res) => {
    const testimonial = await new Testimonial(req.body).save();
    res.status(httpStatus.CREATED).send(testimonial);
  },
};

const updateTestimonial = {
  validation: {
    body: Joi.object().keys({
      name: Joi.string(),
      message: Joi.string(),
      designation: Joi.string().allow("", null),
      company: Joi.string().allow("", null),
      image: Joi.string().allow("", null),
      isVisible: Joi.boolean(),
    }),
  },
  handler: async (req, res) => {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!testimonial)
      throw new ApiError(httpStatus.NOT_FOUND, "Testimonial not found");
    res.send(testimonial);
  },
};

const deleteTestimonial = {
  handler: async (req, res) => {
    const deleted = await Testimonial.findByIdAndDelete(req.params.id);
    if (!deleted)
      throw new ApiError(httpStatus.NOT_FOUND, "Testimonial not found");
    res.send(deleted);
  },
};

const getTestimonials = {
  handler: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    filter.isVisible = req.query.isVisible === "false" ? false : true;

    const testimonials = await Testimonial.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Testimonial.countDocuments(filter);

    res.send({ page, limit, total, testimonials });
  },
};

module.exports = {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getTestimonials,
};
