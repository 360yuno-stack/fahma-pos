const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeFoodeo() {
  console.log('IMPORTANTE: Asegurate de estar logueado en Foodeo en tu navegador Chrome');
  console.log('Iniciando navegador...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  console.log('Ve al navegador que se abrio y:');
  console.log('1. Haz login manualmente en Foodeo');
  console.log('2. Ve a la pagina de productos');
  console.log('3. Presiona ENTER aqui cuando estes listo...');
  
  // Esperar input del usuario
  await new Promise(resolve => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    readline.question('', () => {
      readline.close();
      resolve();
    });
  });
  
  console.log('Extrayendo productos...');
  
  const products = [];
  let currentPage = 1;
  const totalPages = 12;
  
  while (currentPage <= totalPages) {
    console.log('Extrayendo pagina ' + currentPage + ' de ' + totalPages + '...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pageProducts = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        const priceText = cells[5]?.textContent || '';
        const priceMatch = priceText.match(/[\d,]+/);
        return {
          code: cells[1]?.textContent?.trim() || '',
          name: cells[3]?.textContent?.trim() || '',
          category: cells[4]?.textContent?.trim() || '',
          price: priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0,
          hasModifiers: cells[7]?.textContent?.trim() === 'Si'
        };
      }).filter(p => p.code && p.name);
    });
    
    console.log('  Encontrados: ' + pageProducts.length + ' productos');
    products.push(...pageProducts);
    
    if (currentPage < totalPages) {
      try {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const nextBtn = buttons.find(b => b.textContent.includes('siguiente') || b.getAttribute('aria-label')?.includes('siguiente'));
          if (nextBtn) nextBtn.click();
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.log('No se pudo navegar a la siguiente pagina');
      }
    }
    currentPage++;
  }
  
  const filePath = './productos_foodeo.json';
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
  console.log('\nTotal productos extraidos: ' + products.length);
  console.log('Guardados en: ' + filePath);
  
  await browser.close();
  return products;
}

if (require.main === module) {
  scrapeFoodeo().catch(console.error);
}

module.exports = scrapeFoodeo;