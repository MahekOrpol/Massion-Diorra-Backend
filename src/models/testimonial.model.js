const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const testimonialSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    designation: { type: String },
    company: { type: String },
    image: { type: String }, // optional avatar or photo
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

testimonialSchema.plugin(toJSON);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);
module.exports = Testimonial;
