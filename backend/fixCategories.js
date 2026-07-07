const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fahma-pos');
  const existingCat = await Category.findOne();
  const restaurantId = existingCat.restaurant;
  
  // Crear categorias faltantes
  const bebidas = await Category.create({name:'Bebidas',color:'#4ECDC4',order:15,restaurant:restaurantId,hasSubcategories:false,active:true,isActive:true});
  const menu = await Category.create({name:'MENU',color:'#FF8C00',order:16,restaurant:restaurantId,hasSubcategories:false,active:true,isActive:true});
  
  console.log('Categorias creadas: Bebidas, MENU');
  
  // Actualizar productos sin categoria
  const productos = require('./productos_foodeo.json');
  for (const p of productos) {
    if (p.category === 'Sin Asignar') {
      await Product.updateOne({name:p.name},{category:bebidas._id});
    }
    if (p.category === 'MENU') {
      await Product.findOneAndUpdate({name:p.name},{},{upsert:true,setDefaultsOnInsert:true});
      await Product.updateOne({name:p.name},{category:menu._id,price:p.price,restaurant:restaurantId,available:true,sku:p.code});
    }
  }
  
  const total = await Product.countDocuments();
  console.log('Total productos en BD: ' + total);
  process.exit(0);
}

fix();