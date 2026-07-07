const puppeteer = require('puppeteer');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/fahmapos');
const Product = require('./src/models/Product');

(async () => {
  const browser = await puppeteer.launch({ headless: false }); //  VISIBLE para debug
  const page = await browser.newPage();
  
  console.log(' Cargando Foodeo...');
  await page.goto('https://elfogondelaguila.foodeoadmin.com/products/list');
  
  // DEBUG: Esperar 10s y mostrar HTML
  await page.waitForTimeout(10000);
  const title = await page.title();
  console.log(' Título:', title);
  
  const htmlSnippet = await page.evaluate(() => document.body.innerHTML.slice(0, 1000));
  console.log('HTML:', htmlSnippet);
  
  // Buscar CUALQUIER estructura de datos
  const products = await page.evaluate(() => {
    const items = [];
    
    // Buscar tablas
    document.querySelectorAll('table tr').forEach(row => {
      const cells = row.querySelectorAll('td, th');
      if (cells.length >= 2) {
        const name = cells[0]?.textContent?.trim();
        const priceText = cells[1]?.textContent;
        if (name && priceText?.match(/\\d/)) items.push({nombre: name, precio: 0});
      }
    });
    
    // Buscar cards/listas
    document.querySelectorAll('.product, [class*=product], .item, [class*=item]').forEach(item => {
      const name = item.querySelector('h3, h4, h5, .name, [class*=name]')?.textContent?.trim();
      if (name) items.push({nombre: name, precio: 0});
    });
    
    return items.slice(0,10);
  });
  
  console.log(' Productos encontrados:', products.length);
  console.log('Primeros:', products.slice(0,3));
  
  // PAUSA para ver página
  console.log(' Presiona ENTER para cerrar...');
  await new Promise(r => process.stdin.once('data', r));
  
  await browser.close();
})();
