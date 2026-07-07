const mongoose = require('mongoose');

const verifactuConfigSchema = new mongoose.Schema({
  companyName: { type: String, required: true, default: 'Restaurante Demo' },
  nif: { type: String, required: true, default: 'B12345678' },
  isActive: { type: Boolean, default: false },
  certificatePath: { type: String }, // Path to the uploaded .p12/.pfx file
  certificatePassword: { type: String },
  environment: { type: String, enum: ['test', 'production'], default: 'test' },
  lastInvoiceHash: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('VerifactuConfig', verifactuConfigSchema);
