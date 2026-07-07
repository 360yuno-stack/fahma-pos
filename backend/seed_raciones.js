const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

const racionesData = [
  { name: 'Croquetas de Jamón', price: 8.50 },
  { name: 'Patatas Bravas', price: 6.00 },
  { name: 'Calamares a la Andaluza', price: 11.00 },
  { name: 'Oreja a la Plancha', price: 9.50 },
  { name: 'Pimientos de Padrón', price: 7.00 },
  { name: 'Tabla de Quesos', price: 14.00 },
  { name: 'Jamón Ibérico', price: 18.00 },
  { name: 'Chopitos Fritos', price: 12.00 },
  { name: 'Lacón a la Gallega', price: 10.50 },
  { name: 'Ensaladilla Rusa', price: 7.50 }
];

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/fahma_pos');
  
  const racionesCat = await Category.findOne({ name: 'RACIONES' });
  const mediaRacionesCat = await Category.findOne({ name: '1/2 RACION' });
  
  if (!racionesCat || !mediaRacionesCat) {
    console.error('Categorias no encontradas');
    process.exit(1);
  }

  // Insert Raciones
  for (let r of racionesData) {
    const exists = await Product.findOne({ name: r.name, category: racionesCat._id });
    if (!exists) {
      await Product.create({
        name: r.name,
        description: 'Ración de ' + r.name,
        price: r.price,
        category: racionesCat._id,
        sku: 'R' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
        isActive: true,
        isAvailable: true
      });
    }
  }

  // Insert 1/2 Raciones
  for (let r of racionesData) {
    const mediaName = '1/2 ' + r.name;
    const mediaPrice = (r.price * 0.6).toFixed(2);
    const exists = await Product.findOne({ name: mediaName, category: mediaRacionesCat._id });
    if (!exists) {
      await Product.create({
        name: mediaName,
        description: 'Media Ración de ' + r.name,
        price: Number(mediaPrice),
        category: mediaRacionesCat._id,
        sku: 'M' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
        isActive: true,
        isAvailable: true
      });
    }
  }

  console.log('Raciones añadidas con exito.');
  await mongoose.disconnect();
}

seed();
