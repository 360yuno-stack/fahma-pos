const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/fahmapos').then(async () => {
  console.log('=== VERIFICANDO COLECCIONES ===');
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Colecciones:', collections.map(c => c.name));
  
  const Category = require('./src/models/Category');
  const cats = await Category.find({});
  console.log('NUEVAS categorias (modelo):', cats.length);
  console.log('Primeras:', cats.slice(0,2).map(c => ({nombre: c.nombre, icono: c.icono})));
  
  const raw = await mongoose.connection.db.collection('categories').find({}).toArray();
  console.log('RAW categories:', raw.length);
  process.exit(0);
});
