const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/fahmapos')
  .then(async () => {
    console.log('Conectado a MongoDB');
    
    // ELIMINAR TODA LA COLECCION
    await mongoose.connection.db.dropCollection('categories').catch(() => console.log('Coleccion no existe'));
    console.log('Coleccion eliminada completamente');
    
    process.exit(0);
  });
