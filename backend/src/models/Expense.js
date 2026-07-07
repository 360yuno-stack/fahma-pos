const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  concept: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  category: { type: String, enum: ['stock', 'utilities', 'payroll', 'maintenance', 'other'], default: 'other' },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  receipt: { type: String, default: '' }, // URL or path to receipt image
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
