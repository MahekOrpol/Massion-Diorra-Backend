const httpStatus = require('http-status');
const Joi = require('joi');
const { AboutUs } = require('../models');
const { saveFile } = require('../utils/helper');

const createAboutUs = {
    validation: {
        body: Joi.object().keys({
            tagline: Joi.string().required(),
            aboutDescription: Joi.string().required(),
            goalDescription: Joi.string().required(),
            aboutImg: Joi.string().optional(),
            goalImg: Joi.string().optional(),

        }),
    },
    handler: async (req, res) => {
        const { tagline, aboutDescription, goalDescription } = req.body;

        let aboutImg = req.files.aboutImg
            ? await saveFile(req.files.aboutImg)
            : null;

        let goalImg = req.files.goalImg
            ? await saveFile(req.files.goalImg)
            : null;

        const aboutUs = new AboutUs({
            tagline,
            aboutDescription,
            goalDescription,
            aboutImg: aboutImg?.upload_path,
            goalImg: goalImg?.upload_path,
        });
        await aboutUs.save();
        return res.status(httpStatus.CREATED).send(aboutUs);
    }
};

const updateAboutUs = {
    validation: {
        body: Joi.object().keys({
            tagline: Joi.string(),
            aboutDescription: Joi.string(),
            goalDescription: Joi.string(),
            aboutImg: Joi.string(),
            goalImg: Joi.string(),
        }),
    },
    handler: async (req, res) => {
        const aboutUs = await AboutUs.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
        return res.send(aboutUs);
    }
};

const deleteAboutUs = {
    handler: async (req, res) => {
        const aboutUs = await AboutUs.findByIdAndDelete({ _id: req.params.id });
        return res.status(httpStatus.OK).send(aboutUs);
    }
};

const getAboutus = {
    handler: async (req, res) => {
      
        const aboutUs = await AboutUs.find();
        return res.status(httpStatus.OK).send(aboutUs);
    }
};

const getAboutUsById = {
    handler: async (req, res) => {
        try {
            const aboutUs = await AboutUs.findById(req.params.id);
            if (!aboutUs) {
                return res.status(httpStatus.NOT_FOUND).send({ message: 'Entry not found' });
            }
            return res.status(httpStatus.OK).send(aboutUs);
        } catch (error) {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'Invalid ID', error: error.message });
        }
    }
};


module.exports = {
    createAboutUs,
    updateAboutUs,
    deleteAboutUs,
    getAboutus,
    getAboutUsById
};