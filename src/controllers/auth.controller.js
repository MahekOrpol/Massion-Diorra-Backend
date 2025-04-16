const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const Joi = require('joi');
const { password } = require('../validations/custom.validation');
const { User, Register, Token } = require('../models');
const ApiError = require('../utils/ApiError');
const auth = require('../middlewares/auth');
const { jwt } = require('../config/config');
const { generateToken, generateResetPasswordToken } = require('../services/token.service');
const { token } = require('morgan');

const register = {
  validation: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required().custom(password),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    // check if email is already registered
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User already registered');
    }
    // create user
    const newUser = await new User(req.body).save();
    const token = await tokenService.generateAuthTokens(newUser);
    return res.status(httpStatus.CREATED).send({ token, user: newUser });
  }
};

const login = {
  validation: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.isPasswordMatch(password))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }

    const token = await tokenService.generateAuthTokens(user);
    return res.status(httpStatus.OK).send({ token, user });
  }
};

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
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.params);
  console.log('res', res)
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
    const register = await Register.findOne({ email: req.body.email });
    if (!register) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'email not found',
      });
    }

    const generateOTP = () => {
      const digits = '0123456789';
      let OTP = '';

      for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
      }

      return OTP;
    }

    const randomOTP = generateOTP();
    console.log('Random OTP:', randomOTP);


    const newRegister = await Register.findOneAndUpdate({ email: req.body.email }, { generateOTP: randomOTP }, { new: true, upsert: true });

    await emailService.sendOtpOnEmail(req.body.email, randomOTP);

    return res.status(httpStatus.OK).send(newRegister);
  }
};

const verifyOTP = {
  validation: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      generateOTP: Joi.string().required()
    }),
  },
  handler: async (req, res) => {
    const { email, generateOTP } = req.body;
    console.log(generateOTP)
    if (generateOTP) {
      const admin = await Admin.findOne({ email, generateOTP });

      if (admin) {

        const token = generateToken({ email: req.body.email, isAdmin: true });

        const newAdmin = await Admin.findOneAndUpdate({ email: req.body.email }, { token: token }, { new: true, upsert: true });

        return res.status(httpStatus.OK).send({ success: true, message: 'OTP verification successful!', newAdmin });
      } else {
        return res.status(httpStatus.BAD_REQUEST).send({ success: false, message: 'Invalid OTP.' });
      }
    }
  }
};

const forgotPassword = {
  validation: {
    body: Joi.object().keys({
      password: Joi.string().required().custom(password),
      confirmPassword: Joi.string().required(),
      token: Joi.string().required()
    })
  },
  handler: async (req, res) => {
    const { password, token } = req.body;

    const admin = await Admin.findOne({ token });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    else {
      res.status(httpStatus.OK).send({ success: true, message: 'Password reset successfully',admin});
    }
    admin.password = password;
    admin.confirmPassword = password;
    await admin.save();
  }
}

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
  forgotPassword
};
