const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log(' Login Foodeo (debug)...');
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

  console.log(' Login ok, entrando a products/list...');
  await page.goto('https://elfogondelaguila.foodeoadmin.com/products/list', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  // Espera 5s para que cargue todo (SPA)
  await new Promise(r => setTimeout(r, 5000));

  // Dump rápido de estructura
  const info = await page.evaluate(() => {
    return {
      title: document.title,
      // Primeros 2000 chars del body para ver estructura
      html: document.body.innerHTML.slice(0, 2000),
      // Lista de tags relevantes para productos
      tagCounts: {
        tr: document.querySelectorAll('tr').length,
        td: document.querySelectorAll('td').length,
        div: document.querySelectorAll('div').length,
        li: document.querySelectorAll('li').length
      },
      // Clases más comunes
      classes: Array.from(new Set(
        Array.from(document.querySelectorAll('[class]')).flatMap(el => el.className.split(' ')).filter(Boolean)
      )).slice(0, 50)
    };
  });

  console.log('Título:', info.title);
  console.log('Tags:', info.tagCounts);
  console.log('Clases comunes:', info.classes);
  console.log('HTML inicio:\n', info.html);

  console.log('\\n Revisa la ventana abierta para ver cómo están los productos (tabla, cards, lista).');
  await new Promise(r => setTimeout(r, 30000));

  await browser.close();
  process.exit(0);
})();
