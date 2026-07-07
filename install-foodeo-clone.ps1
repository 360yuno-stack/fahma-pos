# ============================================
# INSTALADOR AUTOMATICO FAHMA-POS
# Clon completo de Foodeo
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "INSTALADOR FAHMA-POS - CLON DE FOODEO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Crear estructura de directorios
Write-Host "[1/5] Creando estructura..." -ForegroundColor Yellow
$dirs = @(
    "backend\src\scrapers",
    "frontend\src\pages",
    "frontend\src\components\Admin"
)
foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}
Write-Host "      Estructura creada " -ForegroundColor Green

# Descargar archivos desde repositorio temporal
Write-Host "`n[2/5] Descargando componentes..." -ForegroundColor Yellow

# Crear scraper de Foodeo
$scraper = @"
const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeFoodeo() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://elfogondelaguila.foodeoadmin.com/products/list');
  await page.waitForTimeout(2000);
  
  const products = [];
  let currentPage = 1;
  const totalPages = 12;
  
  while (currentPage <= totalPages) {
    console.log(`Extrayendo página ${currentPage}...`);
    
    const pageProducts = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          code: cells[1]?.textContent?.trim(),
          name: cells[3]?.textContent?.trim(),
          category: cells[4]?.textContent?.trim(),
          price: parseFloat(cells[5]?.textContent?.replace('€', '').replace(',', '.').trim()),
          hasModifiers: cells[7]?.textContent?.trim() === 'Sí'
        };
      });
    });
    
    products.push(...pageProducts);
    
    if (currentPage < totalPages) {
      await page.click('button[aria-label*="siguiente"]');
      await page.waitForTimeout(1000);
    }
    currentPage++;
  }
  
  fs.writeFileSync('./productos_foodeo.json', JSON.stringify(products, null, 2));
  console.log(`Total productos extraídos: ${products.length}`);
  
  await browser.close();
}

if (require.main === module) {
  scrapeFoodeo().catch(console.error);
}

module.exports = scrapeFoodeo;
"@

[System.IO.File]::WriteAllText("$PWD\backend\src\scrapers\foodeoScraper.js", $scraper, (New-Object System.Text.UTF8Encoding $False))
Write-Host "      Scraper creado " -ForegroundColor Green

# Instalar puppeteer
Write-Host "`n[3/5] Instalando dependencias..." -ForegroundColor Yellow
Set-Location backend
npm install puppeteer --save-dev --silent 2>$null
Write-Host "      Puppeteer instalado " -ForegroundColor Green
Set-Location ..

# Crear script de extracción
Write-Host "`n[4/5] Configurando extractor..." -ForegroundColor Yellow
$extractScript = @"
const scraper = require('./src/scrapers/foodeoScraper');
const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
require('dotenv').config();

async function extract() {
  console.log('Extrayendo productos de Foodeo...');
  await scraper();
  
  console.log('Importando a base de datos...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fahma-pos');
  
  const productos = require('../productos_foodeo.json');
  
  const existingCat = await Category.findOne();
  const restaurantId = existingCat ? existingCat.restaurant : new mongoose.Types.ObjectId();
  
  await Product.deleteMany({});
  
  const categories = await Category.find({ restaurant: restaurantId });
  
  for (const prod of productos) {
    const cat = categories.find(c => c.name === prod.category);
    if (cat) {
      await Product.create({
        name: prod.name,
        price: prod.price,
        category: cat._id,
        restaurant: restaurantId,
        available: true,
        sku: prod.code,
        hasModifiers: prod.hasModifiers
      });
    }
  }
  
  console.log('Importación completada');
  process.exit(0);
}

extract();
"@

[System.IO.File]::WriteAllText("$PWD\backend\extractAndImport.js", $extractScript, (New-Object System.Text.UTF8Encoding $False))
Write-Host "      Extractor configurado " -ForegroundColor Green

# Agregar script al package.json
Write-Host "`n[5/5] Configurando comandos..." -ForegroundColor Yellow
$packageJson = Get-Content "$PWD\backend\package.json" -Raw | ConvertFrom-Json
if (-not $packageJson.scripts.PSObject.Properties['extract-foodeo']) {
    $packageJson.scripts | Add-Member -NotePropertyName 'extract-foodeo' -NotePropertyValue 'node extractAndImport.js'
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content "$PWD\backend\package.json"
}
Write-Host "      Comandos configurados " -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "INSTALACION COMPLETADA" -ForegroundColor Green  
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Para extraer e importar todos los productos de Foodeo:" -ForegroundColor Cyan
Write-Host "  1. cd backend" -ForegroundColor White
Write-Host "  2. npm run extract-foodeo" -ForegroundColor White
Write-Host "`nNOTA: Asegúrate de estar logueado en Foodeo en tu navegador" -ForegroundColor Yellow
Write-Host "      El proceso tomará unos 2-3 minutos.`n" -ForegroundColor Yellow