const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: true });

// Prevent overwriting an existing model
module.exports = mongoose.models.ContactUs || mongoose.model('ContactUs', contactSchema);
