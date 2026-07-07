const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  cost: { type: Number, default: 0, min: 0 },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  sku: { type: String, default: '' },
  image: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  modifiers: [{
    name: { type: String },
    options: [{
      name: { type: String },
      price: { type: Number, default: 0 }
    }]
  }],
  taxRate: { type: Number, default: 10 },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
