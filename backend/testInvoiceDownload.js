require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const Invoice = require('./src/models/Invoice');
const axios = require('axios');

async function testDownload() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB Atlas');

  const inv = await Invoice.findOne().sort({ createdAt: -1 });
  if (inv) {
    console.log(`Última factura ID: ${inv._id}, Filename: ${inv.filename}, Path: ${inv.filepath}`);
    const url = `https://fahma-pos.onrender.com/api/invoices/${inv._id}/file`;
    console.log('Probando GET endpoint:', url);
    try {
      const res = await axios.get(url);
      console.log('Respuesta HTTP Status:', res.status, 'Content-Type:', res.headers['content-type']);
    } catch (e) {
      console.log('HTTP Status:', e.response ? e.response.status : e.message, 'Data:', e.response ? e.response.data : '');
    }
  }

  process.exit(0);
}

testDownload();
