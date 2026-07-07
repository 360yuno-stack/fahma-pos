const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  startCash: { type: Number, default: 0 },
  endCash: { type: Number, default: null },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
