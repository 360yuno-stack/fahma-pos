const puppeteer = require('puppeteer');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/fahmapos');

const Product = require('./src/models/Product');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log(' Abriendo login Foodeo...');
  await page.goto('https://elfogondelaguila.foodeoadmin.com/login', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await page.waitForSelector('#input-12', { timeout: 30000 });
  await page.type('#input-12', 'elfogondelaguila@gmail.com');

  await page.waitForSelector('#input-17', { timeout: 30000 });
  await page.type('#input-17', 'Tmp2024');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type=\"submit\"], button')
  ]);

  console.log(' Login completado, cargando lista de productos...');
  await page.goto('https://elfogondelaguila.foodeoadmin.com/products/list', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  // Espera para que cargue la tabla (SPA)
  await new Promise(r => setTimeout(r, 5000));

  const products = await page.evaluate(() => {
    const items = [];
    const rows = document.querySelectorAll('table tbody tr');

    rows.forEach((row, i) => {
      const tds = row.querySelectorAll('td.text-start, td');

      if (tds.length >= 6) {
        const sku = tds[1]?.textContent?.trim();                 // P0000058
        const nombre = tds[3]?.textContent?.trim();              // 1/2 POLLO ASADO
        const categoria = tds[4]?.textContent?.trim() || '';     // COMIDAS
        const priceText = tds[5]?.textContent || '';             // 6,95 €

        const match = priceText.replace('\u00a0', ' ').match(/[\d.,]+/);
        if (nombre && match) {
          const precio = parseFloat(match[0].replace(',', '.'));

          items.push({
            sku,
            nombre,
            precio,
            categoria,
            order: i
          });
        }
      }
    });

    return items;
  });

  console.log(' ' + products.length + ' productos encontrados');

  await Product.deleteMany({});
  console.log(' Productos viejos eliminados');

  if (products.length > 0) {
    await Product.insertMany(
      products.map(p => ({
        nombre: p.nombre,
        precio: p.precio,
        descripcion: '',
        categoria: null,        // luego podemos mapear por nombre de categoría
        order: p.order,
        isActive: true
      }))
    );
    console.log(' Productos Foodeo cargados en MongoDB');
  } else {
    console.log(' No se encontraron productos, revisa selectores.');
  }

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
  process.exit(0);
})();
