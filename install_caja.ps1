# Script de Instalacion Automatizada para el TPV de la Caja
# El Fogon del Aguila - FAHMA POS

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
if ([string]::IsNullOrEmpty($PSScriptRoot)) { $PSScriptRoot = Get-Location }

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   INSTALADOR AUTOMATICO DE TPV (PUENTE DE IMPRESION)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Configurar archivo .env local para actuar como puente
Write-Host "1. Configurando variables de entorno locales..." -ForegroundColor Yellow
$envPath = Join-Path $PSScriptRoot "backend\.env"

$envContent = @"
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fahma_pos
CLOUD_BRIDGE_URL=https://fahma-pos.onrender.com
"@

[System.IO.File]::WriteAllText($envPath, $envContent)
Write-Host "   [OK] Archivo .env configurado correctamente." -ForegroundColor Green

# 2. Instalar dependencias en el backend
Write-Host ""
Write-Host "2. Instalando dependencias de Node.js (esto puede tardar unos segundos)..." -ForegroundColor Yellow
cd "$PSScriptRoot\backend"
npm install --no-audit --no-fund
Write-Host "   [OK] Dependencias instaladas con exito." -ForegroundColor Green

# 3. Crear acceso directo en el escritorio
Write-Host ""
Write-Host "3. Creando acceso directo en tu Escritorio..." -ForegroundColor Yellow

$desktopPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), "Iniciar TPV - El Fogon del Aguila.lnk")
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($desktopPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -Command `"cd '$PSScriptRoot\backend'; node server.js; Start-Process 'https://fahma-pos.vercel.app'`""
$Shortcut.IconLocation = "shell32.dll,220" # Icono de impresora
$Shortcut.Description = "Arranca el puente de impresion y abre el TPV en la nube"
$Shortcut.WorkingDirectory = "$PSScriptRoot\backend"
$Shortcut.Save()

Write-Host "   [OK] Acceso directo creado en el Escritorio con exito." -ForegroundColor Green
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   INSTALACION COMPLETADA CON EXITO!" -ForegroundColor Green
Write-Host "   Ya puedes hacer doble clic en el icono del Escritorio" -ForegroundColor Yellow
Write-Host "   para iniciar el TPV y habilitar las impresoras." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
