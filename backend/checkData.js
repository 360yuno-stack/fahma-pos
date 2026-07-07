const mongoose = require('mongoose');
const Category = require('./models/Category');

mongoose.connect('mongodb://localhost:27017/fahmapos')
  .then(async () => {
    const categories = await Category.find({}).limit(3);
    console.log('Primeras 3 categorias:');
    categories.forEach(cat => {
      console.log(cat.nombre + ' - icono: ' + cat.icono);
    });
    process.exit(0);
  });
