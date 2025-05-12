const httpStatus = require("http-status");
const Joi = require("joi");
const ApiError = require("../utils/ApiError");
const { saveFile, removeFile } = require("../utils/helper");
const GiftingGuide = require("../models/gifningGuide.model");

const createGiftingGuide = {
  validation: {
    body: Joi.object().keys({
        name: Joi.string().required(),
        items: Joi.string().required(),
      image: Joi.string().optional(),
    }),
  },
  handler: async (req, res) => {
    console.log("req.body :>> ", req.body);

    const { name,items } = req.body;
    console.log("req.file", req.files.image);
    let image = req.files.image
      ? await saveFile(req.files.image)
      : null;

    // Check if gifningGuide already exists
    const gifningGuideExists = await GiftingGuide.findOne({ name });
    if (gifningGuideExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Gifting Guide already exists");
    }
    const gifningGuide = new GiftingGuide({
      name,
      items,
      image: image?.upload_path,
    });

    // Create new gifningGuide
    // const gifningGuide = new gifningGuide({ name, image: image.upload_path});
    await gifningGuide.save();

    return res.status(httpStatus.CREATED).json({
      success: true,
      message: "Gifting Guide successfully",
      data: {
        id: gifningGuide._id,
        name: gifningGuide.name,
        items: gifningGuide.items,
        image: gifningGuide.image || null,
        createdAt: gifningGuide.createdAt,
      },
    });
  },
};

const getGiftingGuide = {
  handler: async (req, res) => {
    const categories = await GiftingGuide.find();
    return res.status(httpStatus.OK).send(categories);
  },
};

const updateGiftingGuide = {
  handler: async (req, res) => {
    const { _id } = req.params;
    const { name,items } = req.body;

    let image =
      req.files && req.files.image
        ? await saveFile(req.files.image)
        : null;

    const gifningGuideExists = await GiftingGuide.findOne({ _id });
    if (!gifningGuideExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Gifting Guide not found");
    }

    // Prevent duplicate gifningGuide names
    const duplicategifningGuide = await GiftingGuide.findOne({
      name,
      _id: { $ne: _id },
    });
    if (duplicategifningGuide) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Gifting Guide already exists");
    }

    // Remove old image if a new one is uploaded
    if (image && gifningGuideExists.image) {
      await removeFile(gifningGuideExists.image);
    }

    // Update gifningGuide
    gifningGuideExists.name = name || gifningGuideExists.name;
    gifningGuideExists.items = items || gifningGuideExists.items;
    gifningGuideExists.image =
      image?.upload_path || gifningGuideExists.image;

    await gifningGuideExists.save();

    return res.status(httpStatus.OK).send(gifningGuideExists);
  },
};

const deleteGiftingGuide = {
  handler: async (req, res) => {
    try {
      const { _id } = req.params;

      if (!_id) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Gifting Guide ID is required");
      }

      const gifningGuide = await GiftingGuide.findById(_id);
      if (!gifningGuide) {
        throw new ApiError(httpStatus.NOT_FOUND, "Gifting Guide not found");
      }

      // Remove image if it exists
      if (gifningGuide.image) {
        await removeFile(gifningGuide.image);
      }

      await GiftingGuide.findByIdAndDelete(_id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Gifting Guide deleted successfully",
      });
    } catch (error) {
      console.error("Delete Gifting Guide error:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = {
  createGiftingGuide,
  getGiftingGuide,
  updateGiftingGuide,
  deleteGiftingGuide
};
