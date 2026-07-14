require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fahma_pos';

async function run() {
  console.log('Conectando a la base de datos...');
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Conexión establecida.');

    const newUsername = 'elfogondelaguila';
    const newPassword = 'manoteras40';

    // 1. Buscar o crear el usuario elfogondelaguila
    let user = await User.findOne({ username: newUsername });
    if (!user) {
      console.log(`Creando nuevo usuario '${newUsername}'...`);
      user = new User({
        username: newUsername,
        email: 'elfogondelaguila@gmail.com',
        password: newPassword,
        role: 'admin',
        firstName: 'El Fogón',
        lastName: 'del Águila',
        isActive: true
      });
    } else {
      console.log(`Actualizando contraseña de '${newUsername}'...`);
      user.password = newPassword;
    }

    await user.save();
    console.log(`✅ Usuario '${newUsername}' guardado y configurado como administrador.`);

    // 2. También actualizar contraseña del usuario 'admin' por comodidad si existe
    let adminUser = await User.findOne({ username: 'admin' });
    if (adminUser) {
      console.log("Actualizando también la contraseña del usuario 'admin' a 'manoteras40'...");
      adminUser.password = newPassword;
      await adminUser.save();
      console.log("✅ Contraseña de 'admin' actualizada.");
    }

    console.log('\n======================================================');
    console.log('¡CREDENCIALES ACTUALIZADAS CON ÉXITO!');
    console.log(`Usuario: ${newUsername}`);
    console.log(`Contraseña: ${newPassword}`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
