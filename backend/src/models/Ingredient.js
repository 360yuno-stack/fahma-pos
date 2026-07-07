const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, enum: ['kg', 'g', 'l', 'ml', 'ud', 'portion'], default: 'ud' },
  costPerUnit: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' }
}, { timestamps: true });

module.exports = mongoose.model('Ingredient', ingredientSchema);
