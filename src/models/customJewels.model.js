const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");


const customJewelSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        mobile: {
            type: String,
            trim: true
        },

        email: {
            type: String,
            trim: true,
            lowercase: true
        },

        type: {
            type: String,
            trim: true,
        },

        budget: {
            type: mongoose.Schema.Types.Decimal128,
            default: 0,
        },

        metal: {
            type: String,
        },

        file: {
            type: String,
            required: true,
            trim:true
        },

        message: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
customJewelSchema.plugin(toJSON);
customJewelSchema.plugin(paginate);

/**
 * @typedef CustomJewels
 */
const CustomJewels = mongoose.model("CustomJewels", customJewelSchema);

module.exports = CustomJewels;
