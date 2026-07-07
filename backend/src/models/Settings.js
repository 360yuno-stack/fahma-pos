const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    default: 'FAHMA'
  },
  address: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  taxRate: {
    type: Number,
    default: 10
  },
  logo: {
    type: String,
    default: ''
  },
  nif: {
    type: String,
    default: ''
  },
  ticketFooterText: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
