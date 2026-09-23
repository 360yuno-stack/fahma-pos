require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB Atlas');

    const users = await User.find();
    console.log('--- USUARIOS EN BD ---');
    users.forEach(u => {
      console.log(`ID: ${u._id} | Username: "${u.username}" | Role: "${u.role}" | IsActive: ${u.isActive} | PasswordLen: ${u.password ? u.password.length : 0}`);
    });

    console.log('\n--- CATEGORIA CERVEZAS ---');
    const cervezaCat = await Category.findOne({ name: { $regex: /cerveza/i } });
    console.log('Cat Cervezas:', cervezaCat ? { id: cervezaCat._id, name: cervezaCat.name } : 'No encontrada');

    console.log('\n--- PRODUCTO 1870 ---');
    const prods1870 = await Product.find({ name: { $regex: /1870/i } });
    console.log('Prods 1870:', prods1870);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

test();
