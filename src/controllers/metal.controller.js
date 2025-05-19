const Joi = require("joi");
const Metal = require("../models/metal.model");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const createMetal = {
  validation: {
    body: Joi.object().keys({
      metal: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    try {
      const { metal } = req.body;

      // Check if metal already exists
      const metalExists = await Metal.findOne({ metal });
      if (metalExists) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Metal already exists");
      }
      const metalData = new Metal({
        metal,
      });
      // Create new metal
      await metalData.save();
      return res.status(httpStatus.CREATED).json({
        success: true,
        message: "Metal created successfully",
        data: {
          id: metalData._id,
          metal: metalData.metal,
          createdAt: metalData.createdAt,
        },
      });
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: error.message });
    }
  },
};

const getMetal = {
  handler: async (req, res) => {
    try {
      const metals = await Metal.find();
      return res.status(httpStatus.OK).send(metals);
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: error.message });
    }
  },
};

const updateMetal = {
  handler: async (req, res) => {
    try {
      const { _id } = req.params;
      const { metal } = req.body;

      // Check if metal already exists
      const metalExists = await Metal.findById(_id);
      if (!metalExists) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Metal not found");
      }

      // Update metal
      metalExists.metal = metal;
      await metalExists.save();

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Metal updated successfully",
        data: {
          id: metalExists._id,
          metal: metalExists.metal,
          createdAt: metalExists.createdAt,
        },
      });
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: error.message });
    }
  },
};
const deleteMetal = {
  handler: async (req, res) => {
    try {
      const { _id } = req.params;

      // Check if metal already exists
      const metalExists = await Metal.findById(_id);
      if (!metalExists) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Metal not found");
      }

      // Delete metal
      await metalExists.remove();

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Metal deleted successfully",
      });
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: error.message });
    }
  },
};

module.exports = {
  createMetal,
  getMetal,
  updateMetal,
  deleteMetal,
};
