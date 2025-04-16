const mongoose = require('mongoose');
const {toJSON} = require('./plugins');
const { validator}=require('validator');

const aboutUsSchema = mongoose.Schema(
    {
        middlename: {
            type: String,
            require: true,
            trim: true,
        },
        gender: {
            type: String,
        },
        email: {
            type: String,
            require: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        category: {
            type: String,
        },
        birthdate:{
            type:String,
        }
    },
    {
        timestamps: true,
    }
);

aboutUsSchema.plugin(toJSON);

/***
 * @typedef AboutUs
 */

const AboutUs=mongoose.model('AboutUs',aboutUsSchema);
module.exports = AboutUs;