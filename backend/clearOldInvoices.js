require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const Invoice = require('./src/models/Invoice');

async function cleanOldInvoices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB Atlas');

    // Buscar facturas antiguas (sin fileData o con fileData vacío)
    const oldInvoicesFilter = {
      $or: [
        { fileData: { $exists: false } },
        { fileData: '' },
        { fileData: null }
      ]
    };

    const countBefore = await Invoice.countDocuments(oldInvoicesFilter);
    console.log(`Encontradas ${countBefore} facturas antiguas sin almacenamiento Base64.`);

    const result = await Invoice.deleteMany(oldInvoicesFilter);
    console.log(`✅ Se han eliminado ${result.deletedCount} facturas antiguas de la base de datos.`);

    const totalRemaining = await Invoice.countDocuments();
    console.log(`Total facturas actuales en la base de datos: ${totalRemaining}`);

    process.exit(0);
  } catch (err) {
    console.error('Error limpiando facturas:', err);
    process.exit(1);
  }
}

cleanOldInvoices();
