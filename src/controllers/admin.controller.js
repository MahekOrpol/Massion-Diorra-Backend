const httpStatus = require("http-status");
const {
  authService,
  userService,
  tokenService,
  emailService,
} = require("../services");
const Joi = require("joi");
const { password } = require("../validations/custom.validation");
const ApiError = require("../utils/ApiError");
const { Admin } = require("../models");

const registerAdmin = {
  validation: {
    body: Joi.object().keys({
      displayName: Joi.string().required(),
      email: Joi.string().required().email(),
      password: Joi.string().required().custom(password),
    }),
  },
  handler: async (req, res) => {
    // check if email is already registered
    const user = await Admin.findOne({ email: req.body.email });
    if (user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User already registered");
    }
    // create user
    const newUser = await new Admin(req.body).save();
    const token = await tokenService.generateAuthTokens(newUser);
    return res.status(httpStatus.CREATED).send({ token, user: newUser });
  },
};

const loginAdmin = {
  validation: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    const { email, password } = req.body;

    const user = await Admin.findOne({ email });
    if (!user || !(await user.isPasswordMatch(password))) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Incorrect email or password"
      );
    }

    const token = await tokenService.generateAuthTokens(user);
    return res.status(httpStatus.OK).send({ token, user });
  },
};

const getAllUser = {
  handler: async (req, res) => {
    const user = await Admin.find()
    // console.log('user', user)
    return res.status(httpStatus.OK).send(user);

  }
}

module.exports = {
  loginAdmin,
  registerAdmin,
  getAllUser
};
