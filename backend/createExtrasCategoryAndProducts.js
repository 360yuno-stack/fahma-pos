require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

const extrasList = [
  { name: 'Aceitunas', price: 1.00, image: '/extras/aceitunas.jpg', sku: 'EXT001' },
  { name: 'Patatas', price: 1.00, image: '/extras/patatas.jpg', sku: 'EXT002' },
  { name: 'Kikos', price: 1.00, image: '/extras/kikos.jpg', sku: 'EXT003' },
  { name: 'Patatas Fritas', price: 4.00, image: '/extras/patatas-fritas.jpg', sku: 'EXT004' },
  { name: 'Salsas', price: 1.00, image: '/extras/salsas.jpg', sku: 'EXT005' },
  { name: 'Huevo', price: 1.00, image: '/extras/huevo.jpg', sku: 'EXT006' },
  { name: 'Bacon', price: 1.00, image: '/extras/bacon.jpg', sku: 'EXT007' }
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB Atlas');

    // 1. Buscar categoría padre "Comidas"
    let comidasCat = await Category.findOne({ name: { $regex: /^comidas$/i } });
    const parentId = comidasCat ? comidasCat._id : null;

    // 2. Buscar o crear la sub-categoría "Extras"
    let extrasCat = await Category.findOne({ name: { $regex: /^extras$/i } });
    if (!extrasCat) {
      extrasCat = await Category.create({
        name: 'Extras',
        description: 'Complementos y extras para tus platos',
        parentCategory: parentId,
        color: '#8B5CF6',
        icon: 'mdi-plus-box',
        order: 9,
        isActive: true
      });
      console.log('✅ Sub-categoría "Extras" creada con ID:', extrasCat._id);
    } else {
      extrasCat.parentCategory = parentId;
      extrasCat.color = '#8B5CF6';
      extrasCat.icon = 'mdi-plus-box';
      extrasCat.isActive = true;
      await extrasCat.save();
      console.log('✅ Sub-categoría "Extras" actualizada con ID:', extrasCat._id);
    }

    // 3. Crear o actualizar los 7 productos de Extras
    for (const item of extrasList) {
      let prod = await Product.findOne({
        name: { $regex: new RegExp('^' + item.name + '$', 'i') },
        category: extrasCat._id
      });

      if (!prod) {
        // También intentar buscar sólo por nombre en caso de que estuviera desubicado
        prod = await Product.findOne({ name: { $regex: new RegExp('^' + item.name + '$', 'i') } });
      }

      if (prod) {
        prod.name = item.name;
        prod.price = item.price;
        prod.category = extrasCat._id;
        prod.image = item.image;
        prod.isAvailable = true;
        prod.isActive = true;
        await prod.save();
        console.log(`✅ Producto actualizado: "${item.name}" -> ${item.price}€ (${item.image})`);
      } else {
        prod = await Product.create({
          name: item.name,
          description: `Extra de ${item.name}`,
          price: item.price,
          category: extrasCat._id,
          image: item.image,
          sku: item.sku,
          isAvailable: true,
          isActive: true
        });
        console.log(`✅ Producto creado: "${item.name}" -> ${item.price}€ (${item.image})`);
      }
    }

    console.log('\n===========================================');
    console.log('¡Sección Extras y 7 productos configurados exitosamente!');
    console.log('===========================================');
    process.exit(0);
  } catch (err) {
    console.error('Error al crear sección Extras:', err);
    process.exit(1);
  }
}

run();
