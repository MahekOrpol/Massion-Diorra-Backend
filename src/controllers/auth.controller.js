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
const { User, Register, Token } = require("../models");
const ApiError = require("../utils/ApiError");
const { generateToken } = require("../services/token.service");
const bcrypt = require("bcryptjs/dist/bcrypt");

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
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User already registered");
    }
    const newUser = await new User(req.body).save();
    const token = await tokenService.generateAuthTokens(newUser);
    return res.status(httpStatus.CREATED).send({ token, user: newUser });
  },
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
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Incorrect email or password"
      );
    }
    const token = await tokenService.generateAuthTokens(user);
    return res.status(httpStatus.OK).send({ token, user });
  },
};

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const resetPassword = catchAsync(async (req, res) => {
  await Admin.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(
    req.params
  );
  await emailService.sendVerificationEmail(req.params.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendOtp = {
  validation: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
    }),
  },
  handler: catchAsync(async (req, res) => {
    const { email } = req.body;
    console.log("sendOtp request received for email:", email);

    // Check if email is already registered in User model
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error("sendOtp failed: Email already registered", { email });
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already registered");
    }

    // Check if email exists in Register model
    let user = await Register.findOne({ email });
    if (!user) {
      // Create new entry in Register model
      user = await new Register({ email }).save();
      console.log("Created new Register entry for:", email);
    }

    // Generate 6-digit OTP
    const randomOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Update user with OTP and expiry
    user.generateOTP = randomOTP;
    user.otpExpiresAt = otpExpiresAt;
    user.updatedAt = new Date();
    user.failedAttempts = 0; // Reset failed attempts on new OTP generation
    await user.save();

    console.log("Generated OTP:", randomOTP, "for user:", {
      _id: user._id,
      email: user.email,
      otpExpiresAt: user.otpExpiresAt,
      generateOTP: user.generateOTP,
    });

    // Send OTP via email
    try {
      await emailService.sendOtpOnEmail(email, randomOTP);
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send OTP email"
      );
    }

    return res.status(httpStatus.OK).send({
      email: user.email,
      message: "OTP sent successfully",
      requestId: new Date().toISOString(),
    });
  }),
};

const verifyOTP = {
  validation: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      generateOTP: Joi.string().required(),
    }),
  },
  handler: catchAsync(async (req, res) => {
    const { email, generateOTP } = req.body;

    // Find user in Register model
    const user = await Register.findOne({ email });
    if (!user) {
      console.error("verifyOTP failed: User not found in Register model", {
        email,
      });
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "User not found. Please request an OTP first."
      );
    }

    console.log("Verifying OTP for:", email);
    console.log("Entered OTP:", generateOTP, "Stored OTP:", user.generateOTP);
    console.log("User details:", {
      _id: user._id,
      email: user.email,
      generateOTP: user.generateOTP,
      otpExpiresAt: user.otpExpiresAt,
      failedAttempts: user.failedAttempts,
    });

    // Check if OTP exists
    if (!user.generateOTP || !user.otpExpiresAt) {
      console.error("verifyOTP failed: No OTP found for user", { email });
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "OTP not found. Please request a new one."
      );
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.otpExpiresAt)) {
      console.error("verifyOTP failed: OTP expired", { email });
      user.generateOTP = null;
      user.otpExpiresAt = null;
      await user.save();
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "OTP expired. Please request a new one."
      );
    }

    // Verify OTP
    if (user.generateOTP !== generateOTP) {
      console.log("ser.generateOTP :>> ", user.generateOTP);
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= 3) {
        user.generateOTP = null;
        user.otpExpiresAt = null;
        console.warn("Too many failed OTP attempts for:", email);
      }
      await user.save();
      console.error("verifyOTP failed: Invalid OTP", {
        email,
        enteredOTP: generateOTP,
      });
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP.");
    }

    // OTP matched
    const token = generateToken({ email: user.email });
    user.token = token;
    user.generateOTP = null;
    user.otpExpiresAt = null;
    user.failedAttempts = 0;
    await user.save();

    console.log("OTP verification successful for:", email);

    return res.status(httpStatus.OK).send({
      success: true,
      message: "OTP verification successful!",
      user: {
        email: user.email,
        token,
      },
    });
  }),
};

const forgotPassword = {
  validation: {
    body: Joi.object().keys({
      password: Joi.string().required().custom(password),
      confirmPassword: Joi.string().required().valid(Joi.ref("password")),
      email: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    const { password, email } = req.body;
    const admin = await Register.findOne({ email });
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    admin.password = await bcrypt.hash(password, 10);
    admin.token = null;
    await admin.save();
    res
      .status(httpStatus.OK)
      .send({ success: true, message: "Password reset successfully" });
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
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  sendOtp,
  verifyOTP,
  forgotPassword,
};
