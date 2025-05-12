const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { toJSON, paginate } = require("./plugins");
const { roles } = require("../config/roles");

const registerSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: false,
      minlength: 9,
      maxlength: 10,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },

    password: {
      type: String,
      required: false,
      trim: true,
      minlength: 8,

      private: true, // used by the toJSON plugin
    },
    ConfirmPassword: {
      type: String,
      required: false,
      trim: true,
      minlength: 8,

      private: true, // used by the toJSON plugin
    },
    generateOTP: { type: String, default: '' },
    otpExpiresAt: { type: Date, default: '' },
    failedAttempts: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

registerSchema.set("toJSON", { virtuals: true });
registerSchema.plugin(toJSON);

registerSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
registerSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const register = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!register;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
registerSchema.methods.isPasswordMatch = async function (password) {
  const register = this;
  return bcrypt.compare(password, register.password);
};

// registerSchema.pre('save', async function (next) {
//     const register = this;
//     if (register.isModified('password')) {
//         register.password = await bcrypt.hash(register.password, 8);
//         // register.confirmPassword = await bcrypt.hash(register.confirmPassword, 8);
//     }
//     next();
// });

registerSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    // Only hash if it is not already hashed
    if (!this.password.startsWith("$2a$")) {
      // Check if password is already hashed
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
  next();
});

/**
 * @typedef Register
 */

const Register = mongoose.model("Register", registerSchema);

module.exports = Register;
