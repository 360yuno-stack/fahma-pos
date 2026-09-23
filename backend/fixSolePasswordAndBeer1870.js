require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

async function run() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fahma_pos';
    console.log('Conectando a MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Conectado a MongoDB Atlas exitosamente');

    // 1. SOLUCIONAR USUARIO SOLE (GESTORA)
    let sole = await User.findOne({ username: 'sole' });
    const hashedPassword = await bcrypt.hash('gestora', 10);

    if (sole) {
      sole.password = hashedPassword;
      sole.role = 'admin';
      sole.isActive = true;
      await sole.save();
      console.log('✅ Usuario "sole" actualizado correctamente con contraseña encriptada (gestora).');
    } else {
      sole = await User.create({
        username: 'sole',
        email: 'gestora@fahma.com',
        password: hashedPassword,
        role: 'admin',
        firstName: 'Sole',
        lastName: 'Gestora',
        isActive: true
      });
      console.log('✅ Usuario "sole" creado correctamente.');
    }

    // 2. SOLUCIONAR CERVEZA 1870 (3.00€)
    let cervezasCat = await Category.findOne({ name: { $regex: /^cerveza/i } });
    if (!cervezasCat) {
      cervezasCat = await Category.create({
        name: 'CERVEZAS',
        color: '#F59E0B',
        icon: 'mdi-beer',
        isActive: true,
        isAvailable: true
      });
      console.log('Categoría CERVEZAS creada');
    } else {
      console.log('Categoría CERVEZAS encontrada:', cervezasCat.name, cervezasCat._id);
    }

    let beer1870 = await Product.findOne({ name: { $regex: /1870/i } });
    if (beer1870) {
      beer1870.category = cervezasCat._id;
      beer1870.price = 3.00;
      beer1870.image = '/cervezas/1870.jpg';
      beer1870.isAvailable = true;
      beer1870.isActive = true;
      await beer1870.save();
      console.log('✅ Cerveza 1870 actualizada:', beer1870._id, beer1870.price, beer1870.image);
    } else {
      beer1870 = await Product.create({
        name: '1870',
        description: 'Cerveza 1870 33cl',
        price: 3.00,
        category: cervezasCat._id,
        image: '/cervezas/1870.jpg',
        sku: 'P0000038',
        isAvailable: true,
        isActive: true
      });
      console.log('✅ Cerveza 1870 creada en MongoDB Atlas:', beer1870._id, beer1870.name, beer1870.price, beer1870.image);
    }

    console.log('\n===========================================');
    console.log('¡Usuario "sole" y Cerveza "1870" configurados correctamente!');
    console.log('===========================================');
    process.exit(0);
  } catch (err) {
    console.error('Error al ejecutar script:', err);
    process.exit(1);
  }
}

run();
