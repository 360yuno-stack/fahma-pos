const mongoose = require('mongoose');

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;
  const localUri = 'mongodb://localhost:27017/fahma_pos';
  
  if (!uri || uri.includes('<TU_CLUSTER_ATLAS>')) {
    console.log('⚠️  MongoDB Atlas no está configurado aún (posee marcador de posición).');
    console.log('👉 Conectando a Base de Datos Local por defecto...');
    uri = localUri;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log('MongoDB conectado: ' + conn.connection.host);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB: ' + error.message);
    if (uri !== localUri) {
      console.log('👉 Intentando conectar a la Base de Datos Local como alternativa...');
      try {
        const conn = await mongoose.connect(localUri);
        console.log('MongoDB local conectado: ' + conn.connection.host);
      } catch (err) {
        console.error('❌ Error crítico: Tampoco se pudo conectar a MongoDB Local: ' + err.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;