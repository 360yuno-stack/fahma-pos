const mongoose = require('mongoose');
const Product = require('./src/models/Product');

mongoose.connect('mongodb://localhost:27017/fahmapos').then(async () => {
  await Product.deleteMany({});
  const products = [
    { nombre: '1/2 POLLO ASADO', precio: 6.95, descripcion: '', categoria: null, order: 1, isActive: true },
    { nombre: 'POLLO ENTERO ASADO', precio: 11.50, descripcion: '', categoria: null, order: 2, isActive: true },
    { nombre: 'COCA COLA 33CL', precio: 2.50, descripcion: '', categoria: null, order: 3, isActive: true },
    { nombre: 'CERVEZA MAHOU', precio: 3.00, descripcion: '', categoria: null, order: 4, isActive: true }
  ];
  await Product.insertMany(products);
  console.log(' Productos manuales cargados');
  process.exit(0);
});
