const mongoose = require('mongoose');

const modifierOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true }
});

const modifierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isRequired: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false }, // if true, can select multiple options
  options: [modifierOptionSchema],
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] // Products this modifier applies to
}, { timestamps: true });

module.exports = mongoose.model('Modifier', modifierSchema);
