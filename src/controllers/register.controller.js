const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const {
  authService,
  userService,
  tokenService,
  emailService,
} = require("../services");
const Joi = require("joi");
const { password } = require("../validations/custom.validation");
const { User, Admin, Token, Register } = require("../models");
const ApiError = require("../utils/ApiError");
const auth = require("../middlewares/auth");
const { jwt } = require("../config/config");
const {
  generateToken,
  generateResetPasswordToken,
} = require("../services/token.service");
const { token } = require("morgan");
const bcrypt = require("bcryptjs");

const register = {
  validation: {
    body: Joi.object().keys({
      name: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().required().email(),
      password: Joi.string().required().custom(password),
      ConfirmPassword: Joi.string()
        .required()
        .valid(Joi.ref("password"))
        .messages({ "any.only": "Passwords do not match" }),
    }),
  },
  handler: async (req, res, next) => {
    try {
      const existingUser = await Register.findOne({ email: req.body.email });
      if (existingUser) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .send({ message: "User already registered" });
      }

      // Hash password before saving
      // req.body.password = await bcrypt.hash(req.body.password, 10);

      const newUser = await new Register(req.body).save();

      // Ensure token generation is working
      const token = await tokenService.generateAuthTokens(newUser);
      if (!token) {
        throw new Error("Token generation failed");
      }

      //       const newUser = await new Register(req.body).save();

      // console.log("New User Created:", newUser); // Debugging log

      // const token = await tokenService.generateAuthTokens(newUser);
      // if (!token) {
      //   throw new Error("Token generation failed");
      // }

      return res.status(httpStatus.CREATED).send({ token, user: newUser });
    } catch (error) {
      console.error("Register Error:", error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: error.message });
    }
  },
};

const login = {
  validation: {
    body: Joi.object().keys({
      loginType: Joi.string().valid('email', 'phone', 'name').required().messages({
        'any.only': 'Login type must be either email, phone, or name',
        'any.required': 'Login type is required'
      }),
      email: Joi.string().email().when('loginType', {
        is: 'email',
        then: Joi.required(),
        otherwise: Joi.optional()
      }).messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required for email login'
      }),
      phone: Joi.string().when('loginType', {
        is: 'phone',
        then: Joi.required(),
        otherwise: Joi.optional()
      }).messages({
        'any.required': 'Phone number is required for phone login'
      }),
      name: Joi.string().when('loginType', {
        is: 'name',
        then: Joi.required(),
        otherwise: Joi.optional()
      }).messages({
        'any.required': 'Name is required for name login'
      }),
      password: Joi.string().required().min(8).messages({
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required'
      })
    }).custom((obj, helpers) => {
      // Additional validation to ensure at least one identifier is provided
      const { loginType, email, phone, name } = obj;
      if (loginType === 'email' && !email) {
        return helpers.error('any.invalid', { message: 'Email is required for email login' });
      }
      if (loginType === 'phone' && !phone) {
        return helpers.error('any.invalid', { message: 'Phone is required for phone login' });
      }
      if (loginType === 'name' && !name) {
        return helpers.error('any.invalid', { message: 'Name is required for name login' });
      }
      return obj;
    })
  },
  handler: async (req, res) => {
    try {
      const { loginType, email, phone, name, password } = req.body;
      let user;

      // Find user based on login type
      switch (loginType) {
        case 'email':
          user = await Register.findOne({ email });
          if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ 
              message: "Invalid email or password" 
            });
          }
          break;

        case 'phone':
          user = await Register.findOne({ phone });
          if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ 
              message: "Invalid phone number or password" 
            });
          }
          break;

        case 'name':
          user = await Register.findOne({ name });
          if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ 
              message: "Invalid name or password" 
            });
          }
          break;

        default:
          return res.status(httpStatus.BAD_REQUEST).json({ 
            message: "Invalid login type" 
          });
      }

      // Check password match
      const isMatch = await user.isPasswordMatch(password);
      if (!isMatch) {
        return res.status(httpStatus.UNAUTHORIZED).json({ 
          message: `Invalid ${loginType} or password` 
        });
      }

      // Generate token
      const token = await tokenService.generateAuthTokens(user);
      return res.status(httpStatus.OK).json({ 
        message: "Login successful",
        token, 
        user 
      });

    } catch (error) {
      console.error("Login Error:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ 
        message: error.message || "Internal server error" 
      });
    }
  }
};

const getAllUser = {
  handler: async (req, res) => {
    const user = await Register.find()
    // console.log('user', user)
    return res.status(httpStatus.OK).send(user);

  }
}

const getUserById = {
  handler: async (req, res) => {
  try {
    console.log(req.params);
    
    const user = await Register.findById(req.params.id);
    if (!user) return res.status(httpStatus.NOT_FOUND).json({ error: 'user not found' });
    res.status(httpStatus.OK).json(user);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
}};

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

// const forgotPassword = catchAsync(async (req, res) => {
//   const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
//   await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
//   res.status(httpStatus.NO_CONTENT).send();
// });

const resetPassword = catchAsync(async (req, res) => {
  await Admin.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(
    req.params
  );
  console.log("res", res);
  await emailService.sendVerificationEmail(req.params.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendOtp = {
  validation: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
    }),
  },
  handler: async (req, res) => {
    const admin = await Admin.findOne({ email: req.body.email });
    if (!admin) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "email not found",
      });
    }

    const generateOTP = () => {
      const digits = "0123456789";
      let OTP = "";

      for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
      }

      return OTP;
    };

    const randomOTP = generateOTP();
    console.log("Random OTP:", randomOTP);

    const newAdmin = await Admin.findOneAndUpdate(
      { email: req.body.email },
      { generateOTP: randomOTP },
      { new: true, upsert: true }
    );

    await emailService.sendOtpOnEmail(req.body.email, randomOTP);

    return res.status(httpStatus.OK).send(newAdmin);
  },
};

const verifyOTP = {
  validation: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      generateOTP: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    const { email, generateOTP } = req.body;
    console.log(generateOTP);
    if (generateOTP) {
      const admin = await Admin.findOne({ email, generateOTP });

      if (admin) {
        const token = generateToken({ email: req.body.email, isAdmin: true });

        const newAdmin = await Admin.findOneAndUpdate(
          { email: req.body.email },
          { token: token },
          { new: true, upsert: true }
        );

        return res.status(httpStatus.OK).send({
          success: true,
          message: "OTP verification successful!",
          newAdmin,
        });
      } else {
        return res
          .status(httpStatus.BAD_REQUEST)
          .send({ success: false, message: "Invalid OTP." });
      }
    }
  },
};

const forgotPassword = {
  validation: {
    body: Joi.object().keys({
      password: Joi.string().required().custom(password),
      confirmPassword: Joi.string().required(),
      token: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    const { password, token } = req.body;

    const admin = await Admin.findOne({ token });
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    } else {
      res
        .status(httpStatus.OK)
        .send({ success: true, message: "Password reset successfully", admin });
    }
    admin.password = password;
    admin.confirmPassword = '-';
    await admin.save();
  },
};

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  // forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  sendOtp,
  verifyOTP,
  forgotPassword,
  getAllUser,
  getUserById,
};
