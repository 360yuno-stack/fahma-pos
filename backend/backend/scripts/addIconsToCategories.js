const mongoose = require('mongoose');
const Category = require('../models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fahma_pos';

const data = {
  '1/2 RACION': { icon: '', color: '#EF4444', order: 1 },
  'Bebidas': { icon: '', color: '#F59E0B', hasSubcategories: true, order: 2 },
  'CAFES': { icon: '', color: '#8B4513', order: 3 },
  'CERVEZAS': { icon: '', color: '#FCD34D', order: 4 },
  'COMIDAS': { icon: '', color: '#1F2937', order: 5 },
  'COPAS': { icon: '', color: '#7C3AED', order: 6 },
  'DESAYUNOS': { icon: '', color: '#3B82F6', order: 7 },
  'ENERGIZANTES': { icon: '', color: '#10B981', order: 8 },
  'EXTRAS': { icon: '', color: '#6B7280', order: 9 },
  'INFUSIONES': { icon: '', color: '#EC4899', order: 10 },
  'plato combinado': { icon: '', color: '#F97316', order: 11 },
  'RACIONES': { icon: '', color: '#DC2626', hasSubcategories: true, order: 12 },
  'REFRESCOS': { icon: '', color: '#06B6D4', order: 13 },
  'ZUMOS': { icon: '', color: '#FB923C', order: 14 }
};

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(' Conectado a MongoDB\n');
    
    let ok = 0, fail = 0;
    for (const [name, d] of Object.entries(data)) {
      const res = await Category.updateOne({ name }, { $set: { icon: d.icon, color: d.color, hasSubcategories: d.hasSubcategories || false, order: d.order }});
      if (res.matchedCount > 0) { console.log(` ${name}  ${d.icon}`); ok++; } 
      else { console.log(` ${name}`); fail++; }
    }
    
    console.log(`\n Actualizadas: ${ok}, No encontradas: ${fail}\n`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (e) {
    console.error(' Error:', e);
    process.exit(1);
  }
}

main();
