const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { validator } = require('validator');

const blogsSchema = mongoose.Schema(
    {
        headline: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        articleBody: {
            type: String,
            required: true,
            trim: true,
        },
        authorName: {
            type: String,
            required: true,
            trim: true,
        },
        imges: {
            type: String, // Storing image URL or file patha
            trim: true,
        },
        trend: {
            type: [String],
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

blogsSchema.plugin(toJSON);

/***
 * @typedef Blogs
 */

const Blogs = mongoose.model('Blogs', blogsSchema);
module.exports = Blogs;