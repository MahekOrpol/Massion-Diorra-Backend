const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const validator = require("validator");  // ✅ REQUIRED IMPORT

const savedAddressSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Register",
      required: true,
    },
    email: {
      type: String,
      required: true,
    //   trim: true,
    //   lowercase: true,
    //   validate(value) {
    //     if (!validator.isEmail(value)) {
    //       throw new Error("Invalid email");
    //     }
    //   },
    },
    country: {
      type: String,
      required: true,
    },
    firstName: {    
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    apartment:{
      type: String,
    },
    city:{
      type: String,
      required: true,
    },
    state:{
      type: String,
      required: true,
    },
    zipCode:{
      type: String,
      required: true,
    },
    phoneNumber:{
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

savedAddressSchema.plugin(toJSON);
savedAddressSchema.plugin(paginate);

/**
 * @typedef SavedAddress
 */
const SavedAddress = mongoose.model("SavedAddress", savedAddressSchema);

module.exports = SavedAddress;
