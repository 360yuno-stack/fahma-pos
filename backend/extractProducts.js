const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to desktop
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to login...');
  await page.goto('https://elfogondelaguila.foodeoadmin.com/login', { waitUntil: 'networkidle2' });
  
  // Dump HTML for debugging if needed
  // const html = await page.content();
  // fs.writeFileSync('login.html', html);
  
  console.log('Typing credentials...');
  // Find the inputs. Vuetify usually uses input[type="text"]
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].type('elfogondelaguila@gmail.com');
    await inputs[1].type('Tmp2024');
    
    // Press enter to submit
    await inputs[1].press('Enter');
  } else {
    console.log('Could not find enough inputs, found: ' + inputs.length);
  }
  
  console.log('Waiting for navigation...');
  // Wait for network to be idle after login
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.log('Navigation timeout, maybe already there'));
  
  console.log('Intercepting responses...');
  const products = [];
  page.on('response', async (response) => {
    if (response.url().includes('products') && response.request().method() === 'GET') {
      try {
        const json = await response.json();
        fs.writeFileSync('foodeo_products.json', JSON.stringify(json, null, 2));
        console.log('Products saved to foodeo_products.json! Extracted ' + (Array.isArray(json) ? json.length : json.data?.length) + ' items.');
      } catch (err) {}
    }
    if (response.url().includes('categories') && response.request().method() === 'GET') {
      try {
        const json = await response.json();
        fs.writeFileSync('foodeo_categories.json', JSON.stringify(json, null, 2));
        console.log('Categories saved!');
      } catch (err) {}
    }
  });

  console.log('Navigating to products page...');
  await page.goto('https://elfogondelaguila.foodeoadmin.com/products', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Navigating to categories page...');
  await page.goto('https://elfogondelaguila.foodeoadmin.com/categories', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  await browser.close();
  console.log('Done.');
})();
