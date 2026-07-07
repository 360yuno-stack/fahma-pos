const scraper = require('./src/scrapers/foodeoScraper');
const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
require('dotenv').config();

async function extract() {
  console.log('Extrayendo productos de Foodeo...');
  await scraper();
  
  console.log('Importando a base de datos...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fahma-pos');
  
  const productos = require('./productos_foodeo.json');
  
  const existingCat = await Category.findOne();
  const restaurantId = existingCat ? existingCat.restaurant : new mongoose.Types.ObjectId();
  
  console.log('Eliminando productos existentes...');
  await Product.deleteMany({});
  
  const categories = await Category.find({ restaurant: restaurantId });
  console.log('Categorias encontradas: ' + categories.length);
  
  let importados = 0;
  for (const prod of productos) {
    const cat = categories.find(c => c.name === prod.category);
    if (cat) {
      await Product.create({
        name: prod.name,
        price: prod.price,
        category: cat._id,
        restaurant: restaurantId,
        available: true,
        sku: prod.code,
        isActive: true
      });
      importados++;
    } else {
      console.log('Categoria no encontrada: ' + prod.category + ' para producto: ' + prod.name);
    }
  }
  
  console.log('Productos importados: ' + importados + ' de ' + productos.length);
  process.exit(0);
}

extract();