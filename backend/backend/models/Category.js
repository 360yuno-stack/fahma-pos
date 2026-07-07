const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  icon: { type: String, default: '' },
  color: { type: String, default: '#6B7280' },
  hasSubcategories: { type: Boolean, default: false },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  image: String
}, { timestamps: true });

CategorySchema.index({ order: 1 });
CategorySchema.index({ name: 1 });

module.exports = mongoose.model('Category', CategorySchema);
