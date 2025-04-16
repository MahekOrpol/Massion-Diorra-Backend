const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  id: { type: String, required: true }, // e.g., 'order'
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;
