const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../frontend/public/comidas');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Curated high quality food photos from Unsplash
const images = [
  { name: 'alitas-pollo.jpg', url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80' },
  { name: 'aros-jalapeno.jpg', url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80' },
  { name: 'provolone.jpg', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
  { name: 'torreznos.jpg', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
  { name: 'gambones.jpg', url: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=600&auto=format&fit=crop&q=80' },
  { name: 'puntillas.jpg', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80' },
  { name: 'tortillitas-camaron.jpg', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80' },
  { name: 'oreja-cerdo.jpg', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80' },
  { name: 'tequenos.jpg', url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80' },
  { name: 'empanadas.jpg', url: 'https://images.unsplash.com/photo-1628102491629-778571d893a3?w=600&auto=format&fit=crop&q=80' },
  { name: 'boquerones-rebozados.jpg', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80' },
  { name: 'boquerones-vinagre.jpg', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80' },
  { name: 'nuggets.jpg', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80' },
  { name: 'fingers-pollo.jpg', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80' },
  { name: 'croquetas.jpg', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80' },
  { name: 'huevos-rotos.jpg', url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80' },
  { name: 'tortilla-patatas.jpg', url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80' },
  { name: 'tabla-embutidos.jpg', url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80' },
  { name: 'rejos.jpg', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80' },
  { name: 'anillas-romana.jpg', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80' },
  { name: 'aros-cebolla.jpg', url: 'https://images.unsplash.com/photo-1639024471287-032f66e6545b?w=600&auto=format&fit=crop&q=80' },
  { name: 'salchipapa.jpg', url: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&auto=format&fit=crop&q=80' },
  { name: 'hamburguesa-vacuno.jpg', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
  { name: 'hamburguesa-pollo.jpg', url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80' },
  { name: 'hamburguesa-aguila.jpg', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80' },
  { name: 'sandwich-huevo.jpg', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
  { name: 'sandwich-aguila.jpg', url: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&auto=format&fit=crop&q=80' },
  { name: 'ensalada-cesar.jpg', url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&fit=crop&q=80' },
  { name: 'parrillada.jpg', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
  { name: 'secreto.jpg', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
  { name: 'entrana.jpg', url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80' },
  { name: 'entrecot.jpg', url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&auto=format&fit=crop&q=80' },
  { name: 'pizza-dona-aguila.jpg', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80' },
  { name: 'pizza-vegana.jpg', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80' },
  { name: 'pizza-hawai.jpg', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80' },
  { name: 'pizza-4-quesos.jpg', url: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=600&auto=format&fit=crop&q=80' }
];

function download(item) {
  return new Promise((resolve) => {
    const dest = path.join(targetDir, item.name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`Ya existe: ${item.name}`);
      return resolve();
    }
    const file = fs.createWriteStream(dest);
    https.get(item.url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (redirectRes) => {
          redirectRes.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Descargado (redirect): ${item.name}`);
            resolve();
          });
        }).on('error', () => resolve());
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Descargado: ${item.name}`);
          resolve();
        });
      }
    }).on('error', (err) => {
      console.error(`Error descargando ${item.name}:`, err.message);
      resolve();
    });
  });
}

async function run() {
  console.log(`Descargando ${images.length} imágenes para la carta...`);
  for (const img of images) {
    await download(img);
  }
  console.log('✅ Descargas finalizadas.');
}

run();
