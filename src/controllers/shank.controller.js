const Joi = require("joi");
const Metal = require("../models/metal.model");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { saveFile, removeFile } = require("../utils/helper");
const Shank = require("../models/shank.model");


const createShank = {
    validation: {
      body: Joi.object().keys({
          shank: Joi.string().required(),
          image: Joi.string().optional(),
      }),
    },
handler: async (req, res) => {
  try {
    const { shank } = req.body;

    let image = req.files.image
      ? await saveFile(req.files.image)
      : null;
    // Check if diamond shape already exists
    const diamondShapeExists = await Shank.findOne({ shank });
    if (diamondShapeExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Shank already exists"
      );
    }
    const diamondShapeData = new Shank({
      shank,
      image: image?.upload_path,
    });
    // Create new diamond shape
    await diamondShapeData.save();
    return res.status(httpStatus.CREATED).json({
      success: true,
      message: "Shank created successfully",
      data: {
        id: diamondShapeData._id,
        shank: diamondShapeData.shank,
          image: diamondShapeData.image || null,
        createdAt: diamondShapeData.createdAt,
      },
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
},
};
const getShank = {
handler: async (req, res) => {
  try {
    const diamondShapes = await Shank.find();
    return res.status(httpStatus.OK).send(diamondShapes);
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
},
};
const updateShank = {
  handler: async (req, res) => {
    try {
      const { _id } = req.params;
      const { shank } = req.body;

      // Find the existing diamond shape
      const diamondShapeExists = await Shank.findById(_id);
      if (!diamondShapeExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Shank not found");
      }

      // Save new image if uploaded
      let image = req.files?.image
        ? await saveFile(req.files.image)
        : null;

      // Remove old image only if new one is uploaded
      if (image && diamondShapeExists.image) {
        await removeFile(diamondShapeExists.image);
      }

      // Update fields
      diamondShapeExists.shank = shank;
      diamondShapeExists.image = image
        ? image.upload_path
        : diamondShapeExists.image; // Retain old image if no new one

      await diamondShapeExists.save();

      return res.status(httpStatus.OK).json({
        success: true,
      message: "Shank updated successfully",
        data: {
          id: diamondShapeExists._id,
          shank: diamondShapeExists.shank,
          image: diamondShapeExists.image,
          createdAt: diamondShapeExists.createdAt,
        },
      });
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: error.message });
    }
  },
};
const deleteShank = {
handler: async (req, res) => {
  try {
    const { _id } = req.params;

    // Check if diamond shape already exists
    const diamondShapeExists = await Shank.findById(_id);
    if (!diamondShapeExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Shank not found");
    }
    // Delete diamond shape
    await diamondShapeExists.remove();
    return res.status(httpStatus.OK).json({
      success: true,
      message: "Shank deleted successfully",
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
},
};

module.exports = {
  createShank,
  getShank,
  updateShank,
  deleteShank,
};