const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createWishlist = {
  body: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
    productId: Joi.string().custom(objectId).required(),
    selectedMetal: Joi.string().required(),
    selectedSize: Joi.string().optional()
  }),
};

const getWishlist = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
};

const deleteWishlist = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createWishlist,
  getWishlist,
  deleteWishlist,
}; 