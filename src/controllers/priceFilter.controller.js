const Joi = require("joi");
const { PriceFilter } = require("../models");
const httpStatus = require("http-status");

const createPriceFilter = {
    validation: {
        body: Joi.object()
            .keys({
                filterPrice: Joi.string().required()
            })
    },
    handler: async (req, res) => {
        try {
            const price = await new PriceFilter(req.body).save();

            return res.status(httpStatus.CREATED).send(price);
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                status: false,
                message: "Error deleting price",
                error: error.message,
            });
        }
    }
}
const getPriceFilter = {
    handler: async (req, res) => {
        try {
            const priceData = await PriceFilter.find().exec();

            if (!priceData) {
                return res.status(httpStatus.NOT_FOUND).json({
                    status: false,
                    message: "Price not found",
                });
            }

            if (!priceData) {
                return res.status(httpStatus.BAD_REQUEST).send({
                    message: "User not found",
                });
            }

            return res.status(httpStatus.OK).send(priceData);
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                status: false,
                message: "Error deleting price",
                error: error.message,
            });
        }
    }
}
const updatePriceFilter = {
    validation: {
        body: Joi.object()
            .keys({
                filterPrice: Joi.string().required()
            })
    },
    handler: async (req, res) => {
        try {
            const { priceId } = req.params;
            const price = await PriceFilter.findByIdAndUpdate({ _id: priceId }, req.body, { new: true });

            if (!price) {
                return res.status(httpStatus.NOT_FOUND).json({
                    status: false,
                    message: "Price not found",
                });
            }

            return res.status(httpStatus.OK).json({
                status: true,
                message: "Price Updated successfully",
                data: price,
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                status: false,
                message: "Error deleting price",
                error: error.message,
            });
        }
    }
}
const deletePriceFilter = {
    handler: async (req, res) => {
        try {
            const { priceId } = req.params;
            const deletedPrice = await PriceFilter.findByIdAndDelete({ _id: priceId });

            if (!deletedPrice) {
                return res.status(httpStatus.NOT_FOUND).json({
                    status: false,
                    message: "Price not found",
                });
            }

            return res.status(httpStatus.OK).json({
                status: true,
                message: "Price deleted successfully",
                data: deletedPrice,
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                status: false,
                message: "Error deleting price",
                error: error.message,
            });
        }

    }
}

module.exports = {
    createPriceFilter,
    getPriceFilter,
    updatePriceFilter,
    deletePriceFilter
}