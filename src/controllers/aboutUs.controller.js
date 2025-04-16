const httpStatus = require('http-status');
const Joi = require('joi');
const { AboutUs } = require('../models');
const catchAsync = require('../utils/catchAsync');
const { log } = require('../config/logger');
const { Console } = require('winston/lib/winston/transports');

const createAboutUs = {
    validation: {
        body: Joi.object().keys({
            middlename: Joi.string().required(),
            gender: Joi.string().required(),
            email: Joi.string().required(),
            category: Joi.string().required(),
            birthdate: Joi.string().required(),
        }),
    },
    handler: async (req, res) => {

        const aboutUs = await new AboutUs(req.body).save();
        return res.status(httpStatus.CREATED).send(aboutUs);
    }
};

const updateAboutUs = {
    validation: {
        body: Joi.object().keys({
            middlename: Joi.string(),
            gender: Joi.string(),
            email: Joi.string(),
            category: Joi.string(),
            birthdate: Joi.string(),
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skipValue = limit * page - limit;
        
        // console.log("limit",typeof req.query.skip);

        const aboutUs = await AboutUs.find({
            ...(req.query?.middlename && { middlename: req.query?.middlename })
        }).limit(limit).skip(skipValue);
        return res.status(httpStatus.OK).send(aboutUs);
    }
};

module.exports = {
    createAboutUs,
    updateAboutUs,
    deleteAboutUs,
    getAboutus
};