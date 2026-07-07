const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  number: {
    type: Number,
    required: true
  },
  zone: {
    type: String,
    default: 'Interior'
  },
  capacity: {
    type: Number,
    default: 4
  },
  status: {
    type: String,
    enum: ['free', 'occupied', 'reserved', 'requesting'],
    default: 'free'
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Table', tableSchema);
