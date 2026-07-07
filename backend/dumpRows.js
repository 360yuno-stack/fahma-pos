const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://elfogondelaguila.foodeoadmin.com/login', { waitUntil: 'networkidle2', timeout: 60000 });

  await page.waitForSelector('#input-12', { timeout: 30000 });
  await page.type('#input-12', 'elfogondelaguila@gmail.com');

  await page.waitForSelector('#input-17', { timeout: 30000 });
  await page.type('#input-17', 'Tmp2024');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type=\"submit\"], button')
  ]);

  await page.goto('https://elfogondelaguila.foodeoadmin.com/products/list', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));

  const info = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.slice(0, 3).map((row, i) => ({
      index: i,
      html: row.outerHTML
    }));
  });

  console.log('Primeras filas:\n', JSON.stringify(info, null, 2));

  await new Promise(r => setTimeout(r, 30000));
  await browser.close();
  process.exit(0);
})();
