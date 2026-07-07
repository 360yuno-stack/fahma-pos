const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  ingredients: [{
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantity: { type: Number, required: true, min: 0 }
  }],
  preparationInstructions: { type: String, default: '' },
  totalCost: { type: Number, default: 0 } // Auto-calculated based on ingredient quantities and costs
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
