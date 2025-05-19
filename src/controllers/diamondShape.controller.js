const Joi = require("joi");
const Metal = require("../models/metal.model");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { saveFile, removeFile } = require("../utils/helper");
const DiamondShape = require("../models/diamondShape.model");


const createDiamondShape = {
    validation: {
      body: Joi.object().keys({
          diamondShape: Joi.string().required(),
          diamondImage: Joi.string().optional(),
      }),
    },
handler: async (req, res) => {
  try {
    const { diamondShape } = req.body;

    let diamondImage = req.files.diamondImage
      ? await saveFile(req.files.diamondImage)
      : null;
    // Check if diamond shape already exists
    const diamondShapeExists = await DiamondShape.findOne({ diamondShape });
    if (diamondShapeExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Diamond shape already exists"
      );
    }
    const diamondShapeData = new DiamondShape({
      diamondShape,
      diamondImage: diamondImage?.upload_path,
    });
    // Create new diamond shape
    await diamondShapeData.save();
    return res.status(httpStatus.CREATED).json({
      success: true,
      message: "Diamond shape created successfully",
      data: {
        id: diamondShapeData._id,
        diamondShape: diamondShapeData.diamondShape,
          diamondImage: diamondShapeData.diamondImage || null,
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
const getDiamondShape = {
handler: async (req, res) => {
  try {
    const diamondShapes = await DiamondShape.find();
    return res.status(httpStatus.OK).send(diamondShapes);
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
},
};
const updateDiamondShape = {
handler: async (req, res) => {
  try {
    const { _id } = req.params;
    const { diamondShape } = req.body;

    let diamondImage = req.files.diamondImage
    ? await saveFile(req.files.diamondImage)
    : null;
    // Check if diamond shape already exists
    const diamondShapeExists = await DiamondShape.findById(_id);
    if (!diamondShapeExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Diamond shape not found");
    }
    
    if (diamondImage && diamondShapeExists.diamondImage) {
      await removeFile(diamondShapeExists.diamondImage);
    }

    // Update diamond shape
    diamondShapeExists.diamondShape = diamondShape;
    await diamondShapeExists.save();
    return res.status(httpStatus.OK).json({
      success: true,
      message: "Diamond shape updated successfully",
      data: {
        id: diamondShapeExists._id,
        diamondShape: diamondShapeExists.diamondShape,
        createdAt: diamondShapeExists.createdAt,
      diamondImage: diamondImage?.upload_path,

      },
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
},
};
const deleteDiamondShape = {
handler: async (req, res) => {
  try {
    const { _id } = req.params;

    // Check if diamond shape already exists
    const diamondShapeExists = await DiamondShape.findById(_id);
    if (!diamondShapeExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Diamond shape not found");
    }
    // Delete diamond shape
    await diamondShapeExists.remove();
    return res.status(httpStatus.OK).json({
      success: true,
      message: "Diamond shape deleted successfully",
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ message: error.message });
  }
},
};

module.exports = {
  createDiamondShape,
  getDiamondShape,
  updateDiamondShape,
  deleteDiamondShape,
};