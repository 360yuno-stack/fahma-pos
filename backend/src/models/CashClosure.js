const mongoose = require('mongoose');

const cashClosureSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  actualCash: {
    type: Number,
    default: 0
  },
  expectedCash: {
    type: Number,
    default: 0
  },
  difference: {
    type: Number,
    default: 0
  },
  expenses: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  cashSales: {
    type: Number,
    default: 0
  },
  cardSales: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CashClosure', cashClosureSchema);
