const mongoose = require('mongoose');
const {toJSON} = require('./plugins');
const { validator}=require('validator');

const aboutUsSchema = mongoose.Schema(
    {
        tagline: {
            type: String,
            required: true,
            trim: true,
        },
        aboutDescription:{
           type: String,
           required: true,
           trim: true,
       },
        goalDescription:{
           type: String,
           required: true,
           trim: true,
       },
       aboutImg:{
        type: String, // Storing image URL or file path
        trim: true,
       },
       goalImg:{
        type: String, // Storing image URL or file path
        trim: true,
       },
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