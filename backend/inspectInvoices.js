require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const Invoice = require('./src/models/Invoice');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB Atlas');

  const invoices = await Invoice.find().sort({ createdAt: -1 });
  console.log('Facturas encontradas:', invoices.length);
  invoices.forEach(inv => {
    console.log(`ID: ${inv._id} | Filename: "${inv.filename}" | Path: "${inv.filepath}" | Year: ${inv.year} Q${inv.quarter} | HasData: ${!!inv.fileData}`);
  });

  process.exit(0);
}

check();
