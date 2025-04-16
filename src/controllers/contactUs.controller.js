const httpStatus = require('http-status');
const Joi = require('joi');
const ContactUs = require('../models/contact.model');
const catchAsync = require('../utils/catchAsync');

const updateContactUs = {
  validation: {
    body: Joi.object().keys({
      firstName: Joi.string(),
      lastName: Joi.string(),
      phone: Joi.string(),
      email: Joi.string(),
      message: Joi.string(),
    }),
  },
  handler: async (req, res) => {
    const contactUs = await ContactUs.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    return res.send(contactUs);
  },
};

const getContactById = {
  handler: async (req, res) => {
  try {
    console.log(req.params);
    
    const contact = await ContactUs.findById(req.params.id);
    if (!contact) return res.status(httpStatus.NOT_FOUND).json({ error: 'Contact not found' });
    res.status(httpStatus.OK).json(contact);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
}};


const createContactUs = {
  validation: {
    body: Joi.object().keys({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().required(),
      message: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    const contactUs = await new ContactUs(req.body).save();
    return res.status(httpStatus.CREATED).send(contactUs);
  },
};

const getAllContactUs = {
  handler: async (req, res) => {
    const contactUs = await ContactUs.find();
    return res.status(httpStatus.OK).send(contactUs);
  },
};

const deleteContactUs = {
  handler: async (req, res) => {
    const contactUs = await ContactUs.findById(req.params.id);
    if (!contactUs) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: 'ContactUs not found',
      });
    }
    await ContactUs.findByIdAndDelete(req.params.id);
    return res.status(httpStatus.OK).send({
      message: 'ContactUs deleted successfully',
    });
  },
};

module.exports = {
  createContactUs,
  getAllContactUs,
  deleteContactUs,
  updateContactUs,
  getContactById,
};
