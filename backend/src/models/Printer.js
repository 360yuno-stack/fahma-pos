const mongoose = require('mongoose');

const printerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ipAddress: { type: String, required: true },
  port: { type: Number, default: 9100 },
  type: { 
    type: String, 
    enum: ['facturacion', 'barra', 'cocina', 'kds'], 
    default: 'facturacion' 
  },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  paperWidth: { type: Number, enum: [58, 80], default: 80 },
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  connectionType: { 
    type: String, 
    enum: ['tcp', 'system'], 
    default: 'tcp' 
  },
  mainTpv: { type: String, default: '' },
  secondaryTpv: { type: String, default: '' },
  allowToMarch: { type: Boolean, default: true },
  zones: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Printer', printerSchema);
