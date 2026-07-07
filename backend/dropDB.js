const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/fahmapos')
  .then(async () => {
    console.log('Conectado a MongoDB');
    await mongoose.connection.db.dropDatabase();
    console.log('DATABASE ELIMINADA COMPLETAMENTE');
    process.exit(0);
  });
