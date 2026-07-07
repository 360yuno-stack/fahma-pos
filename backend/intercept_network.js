const puppeteer = require('puppeteer');

async function intercept() {
  console.log('Iniciando Puppeteer...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Enable request interception
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        console.log(`[API REQUEST] URL: ${url}`);
        console.log(`  Method: ${request.method()}`);
        console.log('  Headers:', request.headers());
        const postData = request.postData();
        if (postData) {
          console.log('  Post Data:', postData);
        }
      }
      request.continue();
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(`[API RESPONSE] URL: ${url} | Status: ${response.status()}`);
      }
    });

    console.log('Navegando a la página de login...');
    await page.goto('https://elfogondelaguila.foodeoadmin.com/', { waitUntil: 'networkidle2' });
    
    // Fill credentials
    const inputs = await page.$$('input');
    await inputs[0].type('elfogondelaguila@gmail.com', { delay: 50 });
    await inputs[1].type('Tmp2024', { delay: 50 });
    
    console.log('Haciendo click en Iniciar Sesión...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginBtn = buttons.find(b => b.textContent.includes('Iniciar Sesión'));
      if (loginBtn) loginBtn.click();
    });
    
    console.log('Esperando navegación y llamadas API...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

intercept();
