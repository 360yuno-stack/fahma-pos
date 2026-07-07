const mongoose = require('mongoose');
const Category = require('./src/models/Category');
mongoose.connect('mongodb://localhost:27017/fahmapos').then(async () => {
  console.log('Conectado a MongoDB');
  await Category.deleteMany({});
  const categories = [
    {nombre: '1/2 RACION', color: '#EF4444', icono: '', order: 1},
    {nombre: 'Bebidas variadas', color: '#F59E0B', icono: '', order: 2},
    {nombre: 'CAFES CALIENTES', color: '#8B4513', icono: '', order: 3},
    {nombre: 'CAFES FRIOS', color: '#B84513', icono: '', order: 4},
    {nombre: 'CERVEZAS nacionales e importadas', color: '#FCD34D', icono: '', order: 5},
    {nombre: 'COMIDAS', color: '#FF2937', icono: '', order: 6}
  ];
  await Category.insertMany(categories);
  console.log('6 categorias CON EMOJIS cargadas!');
  process.exit(0);
}).catch(err => {console.error('Error:', err); process.exit(1);});
