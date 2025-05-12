const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { userService } = require("../services");
const Joi = require("joi");
const { saveFile } = require("../utils/helper");
const { password } = require("../validations/custom.validation");
const { User, Register } = require("../models");
const { log } = require("../config/logger");
const mongoose = require("mongoose");

// crystova

const updateUserProfile = {
  validation: {
    body: Joi.object().keys({
      firstName: Joi.string(),
      lastName: Joi.string(),
      phone: Joi.string(),
      gender: Joi.string(),
      birthday: Joi.string(),
      address: Joi.string(),
      address_line2: Joi.string(),

      city: Joi.string(),
      state: Joi.string(),
      postalCode: Joi.string(),
    }),
  },
  handler: async (req, res) => {
    const { userId } = req.params;
    // const user = await Register.findOne({ user_id: userId }, req.body);
    const user = await User.findOneAndUpdate(
      { _id: userId },
      req.body,
      { new: true }
    );
    return res.status(httpStatus.OK).json({
      status: true,
      message: "Profile Updated successfully",
      data: user,
    });
  },
};

const createUserProfile = {
  validation: {
    body: Joi.object().keys({
      user_id: Joi.string(),
      firstName: Joi.string(),
      email: Joi.string(),

      lastName: Joi.string(),
      phone: Joi.string(),
      gender: Joi.string(),
      birthday: Joi.string(),
      address: Joi.string(),
      address_line2: Joi.string(),

      city: Joi.string(),
      state: Joi.string(),
      postalCode: Joi.string(),
    }),
  },
  handler: async (req, res) => {
    const user = await User.create(req.body);
    return res.status(httpStatus.OK).json({
      status: true,
      message: "Profile Created successfully",
      data: user,
    });
  },
};

const getUserProfile = {
  handler: async (req, res) => {
    const { userId } = req.params; // Ensure this matches your URL params or query
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "Invalid user ID format",
      });
    }

    const userData = await User.findOne({ user_id: userId }).exec();
    if (!userData) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: "User not found",
      });
    }

    return res.status(httpStatus.OK).send(userData);
  },
};

const updateProfileImage = {
  handler: async (req, res) => {
    // console.log("hello", req.body)

    if (!req.files?.image || !req.body.user_id) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "User not found",
      });
    }
    if (req.files && req.files?.image) {
      const { upload_path } = await saveFile(req.files?.image);
      req.body.image = upload_path;
    }

    console.log("req.body.image", req.body.image);
    const userData = await Register.findOneAndUpdate(
      { user_id: req.body.id },
      { profilePicture: req.body.image }
    ).exec();
    if (!userData) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "User not found",
      });
    }

    return res.status(httpStatus.OK).send(userData);
  },
};

module.exports = {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  updateProfileImage,
};
