require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function updateProductNamesToUppercase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB Atlas');

    const products = await Product.find({});
    console.log(`Encontrados ${products.length} productos en la base de datos.`);

    let updatedCount = 0;
    for (const prod of products) {
      if (prod.name) {
        const upper = prod.name.trim().toUpperCase();
        if (prod.name !== upper) {
          prod.name = upper;
          await prod.save();
          updatedCount++;
        }
      }
    }

    console.log(`✅ ${updatedCount} productos actualizados a MAYÚSCULAS en MongoDB Atlas.`);
    process.exit(0);
  } catch (err) {
    console.error('Error al actualizar productos a mayúsculas:', err);
    process.exit(1);
  }
}

updateProductNamesToUppercase();
