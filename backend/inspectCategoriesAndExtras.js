require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB Atlas');

  const categories = await Category.find().sort({ order: 1, name: 1 });
  console.log('--- CATEGORÍAS REGISTRADAS ---');
  categories.forEach(c => {
    console.log(`ID: ${c._id} | Name: "${c.name}" | Parent: ${c.parentCategory} | Order: ${c.order}`);
  });

  const extrasProds = await Product.find({
    $or: [
      { name: { $regex: /aceituna|patata|kiko|salsa|huevo|bacon/i } }
    ]
  }).populate('category');

  console.log('\n--- PRODUCTOS EXISTENTES DE EXTRAS ---');
  extrasProds.forEach(p => {
    console.log(`ID: ${p._id} | Name: "${p.name}" | Price: ${p.price} | Cat: "${p.category ? p.category.name : 'Sin Cat'}" | Image: "${p.image}"`);
  });

  process.exit(0);
}

inspect();
