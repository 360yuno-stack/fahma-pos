require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const Printer = require('./src/models/Printer');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

const imageMappings = [
  { match: /alitas/i, image: '/comidas/alitas-pollo.jpg' },
  { match: /cheddar|jalape/i, image: '/comidas/aros-jalapeno.jpg' },
  { match: /provolone/i, image: '/comidas/provolone.jpg' },
  { match: /torrezno/i, image: '/comidas/torreznos.jpg' },
  { match: /gambon/i, image: '/comidas/gambones.jpg' },
  { match: /puntilla/i, image: '/comidas/puntillas.jpg' },
  { match: /camar[oó]n/i, image: '/comidas/tortillitas-camaron.jpg' },
  { match: /oreja/i, image: '/comidas/oreja-cerdo.jpg' },
  { match: /teque/i, image: '/comidas/tequenos.jpg' },
  { match: /empanada/i, image: '/comidas/empanadas.jpg' },
  { match: /boquerones.*rebozado/i, image: '/comidas/boquerones-rebozados.jpg' },
  { match: /boquerones.*vinagre/i, image: '/comidas/boquerones-vinagre.jpg' },
  { match: /nugget/i, image: '/comidas/nuggets.jpg' },
  { match: /finger/i, image: '/comidas/fingers-pollo.jpg' },
  { match: /croqueta/i, image: '/comidas/croquetas.jpg' },
  { match: /huevos.*roto/i, image: '/comidas/huevos-rotos.jpg' },
  { match: /tortilla.*patata/i, image: '/comidas/tortilla-patatas.jpg' },
  { match: /embutido/i, image: '/comidas/tabla-embutidos.jpg' },
  { match: /rejo/i, image: '/comidas/rejos.jpg' },
  { match: /anilla|romana/i, image: '/comidas/anillas-romana.jpg' },
  { match: /aros.*cebolla/i, image: '/comidas/aros-cebolla.jpg' },
  { match: /salchipapa/i, image: '/comidas/salchipapa.jpg' },
  { match: /hamburguesa.*vacuno/i, image: '/comidas/hamburguesa-vacuno.jpg' },
  { match: /hamburguesa.*pollo/i, image: '/comidas/hamburguesa-pollo.jpg' },
  { match: /hamburguesa.*[aá]guila/i, image: '/comidas/hamburguesa-aguila.jpg' },
  { match: /s[aá]ndwich.*huevo/i, image: '/comidas/sandwich-huevo.jpg' },
  { match: /s[aá]ndwich.*nido/i, image: '/comidas/sandwich-aguila.jpg' },
  { match: /ensalada.*cesar/i, image: '/comidas/ensalada-cesar.jpg' },
  { match: /parrillada/i, image: '/comidas/parrillada.jpg' },
  { match: /secreto/i, image: '/comidas/secreto.jpg' },
  { match: /entra[nñ]a/i, image: '/comidas/entrana.jpg' },
  { match: /entrecot/i, image: '/comidas/entrecot.jpg' },
  { match: /pizza.*do[nñ]a/i, image: '/comidas/pizza-dona-aguila.jpg' },
  { match: /pizza.*vegana/i, image: '/comidas/pizza-vegana.jpg' },
  { match: /pizza.*hawai/i, image: '/comidas/pizza-hawai.jpg' },
  { match: /pizza.*4|cheese|queso/i, image: '/comidas/pizza-4-quesos.jpg' }
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB Atlas');

    // 1. ASIGNAR CATEGORÍA EXTRAS A IMPRESORA COCINA
    const extrasCat = await Category.findOne({ name: { $regex: /^extras$/i } });
    if (!extrasCat) {
      console.error('Categoría Extras no encontrada');
    } else {
      const cocinaPrinters = await Printer.find({ 
        $or: [
          { type: 'cocina' },
          { name: { $regex: /cocina/i } }
        ]
      });

      for (const pr of cocinaPrinters) {
        const catIds = pr.categories.map(c => c.toString());
        if (!catIds.includes(extrasCat._id.toString())) {
          pr.categories.push(extrasCat._id);
          await pr.save();
          console.log(`✅ Categoría Extras (${extrasCat.name}) añadida a impresora: ${pr.name}`);
        } else {
          console.log(`Impresora ${pr.name} ya incluye la categoría Extras.`);
        }
      }
    }

    // 2. SEPARAR CHURRASCO Y PIKAÑA
    const carnesCat = await Category.findOne({ name: { $regex: /^carnes$/i } });
    const carnesId = carnesCat ? carnesCat._id : null;

    // Buscar "CHURRASCO PIKAÑA" o "CHURRASCO"
    let churrascoProd = await Product.findOne({ name: { $regex: /churrasco/i } });
    if (churrascoProd) {
      churrascoProd.name = 'CHURRASCO';
      churrascoProd.description = 'Churrasco a la brasa con guarnición';
      churrascoProd.price = 12.00;
      churrascoProd.image = '/comidas/churrasco.jpg';
      if (carnesId) churrascoProd.category = carnesId;
      churrascoProd.isAvailable = true;
      churrascoProd.isActive = true;
      await churrascoProd.save();
      console.log('✅ CHURRASCO configurado como plato independiente (12.00€):', churrascoProd._id);
    } else {
      churrascoProd = await Product.create({
        name: 'CHURRASCO',
        description: 'Churrasco a la brasa con guarnición',
        price: 12.00,
        image: '/comidas/churrasco.jpg',
        category: carnesId,
        sku: 'CAR005',
        isAvailable: true,
        isActive: true
      });
      console.log('✅ CHURRASCO creado (12.00€):', churrascoProd._id);
    }

    // Buscar o crear PIKAÑA
    let pikanaProd = await Product.findOne({ name: { $regex: /^pika|^pica/i } });
    if (pikanaProd && pikanaProd._id.toString() !== churrascoProd._id.toString()) {
      pikanaProd.name = 'PIKAÑA';
      pikanaProd.description = 'Pikaña a la brasa con sal en escamas';
      pikanaProd.price = 12.00;
      pikanaProd.image = '/comidas/pikana.jpg';
      if (carnesId) pikanaProd.category = carnesId;
      pikanaProd.isAvailable = true;
      pikanaProd.isActive = true;
      await pikanaProd.save();
      console.log('✅ PIKAÑA configurada como plato independiente (12.00€):', pikanaProd._id);
    } else {
      pikanaProd = await Product.create({
        name: 'PIKAÑA',
        description: 'Pikaña a la brasa con sal en escamas',
        price: 12.00,
        image: '/comidas/pikana.jpg',
        category: carnesId,
        sku: 'CAR006',
        isAvailable: true,
        isActive: true
      });
      console.log('✅ PIKAÑA creada (12.00€):', pikanaProd._id);
    }

    // 3. ASIGNAR IMÁGENES A TODOS LOS PRODUCTOS DE LA CARTA
    console.log('\n--- ASIGNANDO IMÁGENES A PLATOS DE LA CARTA ---');
    const allProducts = await Product.find({});
    let updatedImages = 0;

    for (const prod of allProducts) {
      if (prod.name === 'CHURRASCO' || prod.name === 'PIKAÑA') continue;

      for (const m of imageMappings) {
        if (m.match.test(prod.name)) {
          prod.image = m.image;
          await prod.save();
          console.log(`🖼️ [${prod.name}] -> ${m.image}`);
          updatedImages++;
          break;
        }
      }
    }

    console.log(`\n✅ ${updatedImages} productos actualizados con sus imágenes correspondientes.`);

    const remainingNoImg = await Product.find({
      $or: [
        { image: { $exists: false } },
        { image: '' },
        { image: null }
      ]
    });
    console.log(`Productos restantes sin imagen: ${remainingNoImg.length}`);
    if (remainingNoImg.length > 0) {
      remainingNoImg.forEach(p => console.log('  - Pendiente:', p.name));
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
