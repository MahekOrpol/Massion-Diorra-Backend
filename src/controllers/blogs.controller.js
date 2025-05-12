const httpStatus = require('http-status');
const Joi = require('joi');
const { saveFile } = require('../utils/helper');
const Blogs = require('../models/blogs.model');

const createBlogs = {
    validation: {
        body: Joi.object().keys({
            headline: Joi.string().required(),
            description: Joi.string().required(),
            articleBody: Joi.string().required(),
            authorName: Joi.string().required(),
            imges: Joi.string().optional(),
            trend: Joi.array().items(Joi.string()).required(),  // Ensure this is an array
        }),
    },
    handler: async (req, res) => {
        const { headline, description, articleBody, authorName, trend } = req.body;

        // Check if 'trend' is coming in as an array
        if (Array.isArray(trend)) {
            // It's already an array, so nothing more needs to be done.
        } else if (typeof trend === 'string') {
            try {
                // If trend is a single string, try parsing it
                req.body.trend = JSON.parse(trend);
            } catch (e) {
                return res.status(httpStatus.BAD_REQUEST).send({
                    code: 400,
                    message: '"trend" must be a valid JSON array string',
                });
            }
        }

        // If `trend` is still not an array, return an error
        if (!Array.isArray(req.body.trend)) {
            return res.status(httpStatus.BAD_REQUEST).send({
                code: 400,
                message: '"trend" must be an array',
            });
        }

        let imges = req.files.imges ? await saveFile(req.files.imges) : null;

        // Create a new blog instance
        const blogs = new Blogs({
            headline,
            description,
            articleBody,
            authorName,
            trend: req.body.trend,  // Use the passed array of trends
            imges: imges?.upload_path,
        });

        await blogs.save();  // Save the blog instance

        return res.status(httpStatus.CREATED).send(blogs);
    }
};

const updateBlogs = {
    validation: {
        body: Joi.object().keys({
            headline: Joi.string(),
            description: Joi.string(),
            articleBody: Joi.string(),
            authorName: Joi.string(),
            imges: Joi.string(),
            trend: Joi.array().items(Joi.string()),  // Ensure this is an array
        }),
    },
    handler: async (req, res) => {  
        const aboutUs = await Blogs.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
        return res.send(aboutUs);
    }
};

const deleteBlogs = {
    handler: async (req, res) => {
        const aboutUs = await Blogs.findByIdAndDelete({ _id: req.params.id });
        return res.status(httpStatus.OK).send(aboutUs);
    }
};

const getBlogs = {
    handler: async (req, res) => {
      
        const aboutUs = await Blogs.find();
        return res.status(httpStatus.OK).send(aboutUs);
    }
};
const getBlogById = {
    handler: async (req, res) => {
        try {
            const blog = await Blogs.findById(req.params.id);
            if (!blog) {
                return res.status(httpStatus.NOT_FOUND).send({ message: 'Blog not found' });
            }
            return res.status(httpStatus.OK).send(blog);
        } catch (error) {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'Invalid blog ID', error: error.message });
        }
    }
};

module.exports = {
    createBlogs,
    updateBlogs,
    deleteBlogs,
    getBlogs,
    getBlogById
};