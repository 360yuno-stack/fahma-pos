const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  modifiers: [{ type: String }],
  notes: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    unique: true
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    default: null
  },
  type: {
    type: String,
    enum: ['dine-in', 'takeaway', 'delivery'],
    default: 'dine-in'
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  // VeriFactu (Hacienda) fields
  verifactuHash: { type: String }, // SHA-256 hash
  verifactuPreviousHash: { type: String },
  verifactuSent: { type: Boolean, default: false },
  verifactuDate: { type: Date },
  items: [orderItemSchema],
  subtotal: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mixed', 'efectivo', 'tarjeta', ''],
    default: ''
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customer: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  notes: { type: String, default: '' },
  paidAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Auto-generate orderNumber before save
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const lastOrder = await this.constructor.findOne({}, {}, { sort: { orderNumber: -1 } });
    this.orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
