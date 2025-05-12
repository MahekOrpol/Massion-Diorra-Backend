const httpStatus = require("http-status");
const Joi = require("joi");
const ApiError = require("../utils/ApiError");
const { saveFile, removeFile } = require("../utils/helper");
const NewArrivals = require("../models/newArrivals.model");

const createNewArrivals = {
    validation: {
      body: Joi.object().keys({}), // No body needed for this route
    },
    handler: async (req, res) => {
      try {
        if (!req.files || !req.files.image) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Image file is required");
        }
  
        const image = await saveFile(req.files.image);
  
        const newArrival = new NewArrivals({
          image: image.upload_path,
        });
  
        await newArrival.save();
  
        return res.status(httpStatus.CREATED).json({
          success: true,
          message: "Image uploaded successfully for New Arrivals",
          data: {
            id: newArrival._id,
            image: newArrival.image,
            createdAt: newArrival.createdAt,
          },
        });
      } catch (error) {
        return res.status(
          error.statusCode || httpStatus.INTERNAL_SERVER_ERROR
        ).json({
          success: false,
          message: error.message || "Something went wrong",
        });
      }
    },
  };

const getNewArrivals = {
  handler: async (req, res) => {
    const categories = await NewArrivals.find({image: { $ne: null }});
    return res.status(httpStatus.OK).send(categories);
  },
};

// optional
const updateNewArrivals = {
  handler: async (req, res) => {
    const { _id } = req.params;
    const { name, items } = req.body;

    let image =
      req.files && req.files.image ? await saveFile(req.files.image) : null;

    const newArrivalsExists = await NewArrivals.findOne({ _id });
    if (!newArrivalsExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Gifting Guide not found");
    }

    // Prevent duplicate newArrivals names
    const duplicatenewArrivals = await NewArrivals.findOne({
      name,
      _id: { $ne: _id },
    });
    if (duplicatenewArrivals) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Gifting Guide already exists"
      );
    }

    // Remove old image if a new one is uploaded
    if (image && newArrivalsExists.image) {
      await removeFile(newArrivalsExists.image);
    }

    // Update newArrivals
    newArrivalsExists.name = name || newArrivalsExists.name;
    newArrivalsExists.items = items || newArrivalsExists.items;
    newArrivalsExists.image = image?.upload_path || newArrivalsExists.image;

    await newArrivalsExists.save();

    return res.status(httpStatus.OK).send(newArrivalsExists);
  },
};

const deleteNewArrivals = {
  handler: async (req, res) => {
    try {
      const { _id } = req.params;

      if (!_id) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Gifting Guide ID is required"
        );
      }

      const newArrivals = await NewArrivals.findById(_id);
      if (!newArrivals) {
        throw new ApiError(httpStatus.NOT_FOUND, "Gifting Guide not found");
      }

      // Remove image if it exists
      if (newArrivals.image) {
        await removeFile(newArrivals.image);
      }

      await NewArrivals.findByIdAndDelete(_id);

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

const createNewArrivalsHeadline = {
  validation: {
    body: Joi.object().keys({
      title: Joi.string().required(),
      description: Joi.string().optional(),
    }),
  },
  handler: async (req, res) => {
    const { title,description } = req.body;

    const newArrivals = new NewArrivals({
      title,
      description
    });
    await newArrivals.save();

    return res.status(httpStatus.CREATED).json({
      success: true,
      message: "New Arrivals created successfully",
      data: {
        id: newArrivals._id,
        title: newArrivals.title || null,
        description: newArrivals.description || null,
        createdAt: newArrivals.createdAt,
      },
    });
  },
};

const getNewArrivalsHeadline = {
  handler: async (req, res) => {
    const newArrivals = await NewArrivals.find({ title: { $ne: null } });
    return res.status(httpStatus.OK).send(newArrivals);
  },
};

const deleteNewArrivalsHeadline = {
  handler: async (req, res) => {
    try {
      const { _id } = req.params;

      if (!_id) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "New Arrivals ID is required"
        );
      }
      const newArrivals = await NewArrivals.findById(_id);
      if (!newArrivals) {
        throw new ApiError(httpStatus.NOT_FOUND, "New Arrivals not found");
      }
 
      await NewArrivals.findByIdAndDelete(_id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "New Arrivals deleted successfully",
      });

    } catch (error) {
      console.error("Delete New Arrivals error:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

const updateNewArrivalsHeadline = {
  handler: async (req, res) => {
    const { _id } = req.params;
    const { title,description } = req.body;

   
    const newArrivalsExists = await NewArrivals.findOne({ _id });
    if (!newArrivalsExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "New Arrivals not found");
    }

    // Prevent duplicate newArrivals names
    const duplicatenewArrivals = await NewArrivals.findOne({
        title,description,
      _id: { $ne: _id },
    });
    if (duplicatenewArrivals) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "New Arrivals already exists"
      );
    }

    // Update newArrivals
    newArrivalsExists.title = title || newArrivalsExists.title;
    newArrivalsExists.description = description || newArrivalsExists.description;

    await newArrivalsExists.save();

    return res.status(httpStatus.OK).send(newArrivalsExists);
  },
};

module.exports = {
  createNewArrivals,
  getNewArrivals,
  updateNewArrivals,
  deleteNewArrivals,
  createNewArrivalsHeadline,
  getNewArrivalsHeadline,
  updateNewArrivalsHeadline,
  deleteNewArrivalsHeadline,
};
