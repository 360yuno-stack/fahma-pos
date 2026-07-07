require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const connectDB = require('./src/config/database');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function importData() {
  await connectDB();
  
  try {
    const data = JSON.parse(fs.readFileSync('./productos_foodeo.json', 'utf8'));
    
    // Extract unique categories
    const categoryNames = [...new Set(data.map(p => p.category))];
    
    console.log('Found categories:', categoryNames);
    
    // Create categories if they don't exist
    const categoryMap = {};
    for (const name of categoryNames) {
      if (!name) continue;
      let cat = await Category.findOne({ name });
      if (!cat) {
        cat = await Category.create({ 
          name, 
          color: '#' + Math.floor(Math.random()*16777215).toString(16), 
          icon: 'mdi-food' 
        });
        console.log('Created category:', name);
      }
      categoryMap[name] = cat._id;
    }
    
    // Clear old products maybe? No, let's just delete them all and insert new ones.
    await Product.deleteMany({});
    console.log('Cleared old products');
    
    // Insert products
    const productsToInsert = data.map(p => ({
      name: p.name,
      description: p.name,
      price: p.price,
      sku: p.code || ('SKU-' + Math.random().toString(36).substr(2, 9)),
      category: categoryMap[p.category],
      image: '',
      stock: 100,
      isAvailable: true
    }));
    
    await Product.insertMany(productsToInsert);
    console.log(`Inserted ${productsToInsert.length} products successfully!`);
    
  } catch (error) {
    console.error('Error importing:', error);
  } finally {
    process.exit(0);
  }
}

importData();
