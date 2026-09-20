require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

async function run() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fahma_pos';
    console.log('Conectando a MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Conectado exitosamente a MongoDB');

    let refrescosCat = await Category.findOne({ 
      name: { $regex: /^refrescos$/i } 
    });

    if (!refrescosCat) {
      refrescosCat = await Category.findOne({ 
        name: { $regex: /^bebidas$/i } 
      });
    }

    if (!refrescosCat) {
      refrescosCat = await Category.create({
        name: 'REFRESCOS',
        color: '#06B6D4',
        icon: 'mdi-cup',
        isActive: true,
        isAvailable: true
      });
      console.log('Categoría REFRESCOS creada');
    } else {
      console.log('Categoría REFRESCOS encontrada:', refrescosCat.name, refrescosCat._id);
    }

    // 1. MONSTER
    let monster = await Product.findOne({ name: { $regex: /^monster/i } });
    if (monster) {
      monster.category = refrescosCat._id;
      monster.price = 2.50;
      monster.image = '/refrescos/monster.jpg';
      monster.isAvailable = true;
      monster.isActive = true;
      await monster.save();
      console.log('✅ Monster actualizado en MongoDB Atlas:', monster._id, monster.name, monster.price, monster.image);
    } else {
      monster = await Product.create({
        name: 'MONSTER',
        description: 'Bebida energética Monster',
        price: 2.50,
        category: refrescosCat._id,
        image: '/refrescos/monster.jpg',
        sku: 'P0000022',
        isAvailable: true,
        isActive: true
      });
      console.log('✅ Monster creado en MongoDB Atlas:', monster._id, monster.name, monster.price, monster.image);
    }

    // 2. RED BULL
    let redbull = await Product.findOne({ name: { $regex: /^red\s*bull/i } });
    if (redbull) {
      redbull.category = refrescosCat._id;
      redbull.price = 2.50;
      redbull.image = '/refrescos/redbull.jpg';
      redbull.isAvailable = true;
      redbull.isActive = true;
      await redbull.save();
      console.log('✅ Red Bull actualizado en MongoDB Atlas:', redbull._id, redbull.name, redbull.price, redbull.image);
    } else {
      redbull = await Product.create({
        name: 'RED BULL',
        description: 'Bebida energética Red Bull',
        price: 2.50,
        category: refrescosCat._id,
        image: '/refrescos/redbull.jpg',
        sku: 'P0000023',
        isAvailable: true,
        isActive: true
      });
      console.log('✅ Red Bull creado en MongoDB Atlas:', redbull._id, redbull.name, redbull.price, redbull.image);
    }

    console.log('\n===========================================');
    console.log('¡Monster y Red Bull configurados correctamente!');
    console.log('===========================================');
    process.exit(0);
  } catch (err) {
    console.error('Error al actualizar productos:', err);
    process.exit(1);
  }
}

run();
