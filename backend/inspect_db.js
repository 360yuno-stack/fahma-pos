const mongoose = require('mongoose');
const Category = require('./src/config/../models/Category');
const Product = require('./src/config/../models/Product');

const mongoURI = 'mongodb://localhost:27017/fahma_pos';

async function run() {
  await mongoose.connect(mongoURI);
  console.log('--- CATEGORIAS ---');
  const cats = await Category.find();
  cats.forEach(c => console.log(`ID: ${c._id}, Nombre: ${c.name || c.nombre}, Parent: ${c.parentCategory}`));

  console.log('\n--- PRODUCTOS ---');
  const prods = await Product.find().populate('category');
  prods.forEach(p => console.log(`ID: ${p._id}, Nombre: ${p.name || p.nombre}, Categoria: ${p.category ? (p.category.name || p.category.nombre) : 'Sin cat'}, Precio: ${p.price}`));

  await mongoose.disconnect();
}
run();
