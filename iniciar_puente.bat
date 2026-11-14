@echo off
title TPV EL FOGON DEL AGUILA - Modo Nube
cls
echo ==========================================================
echo   INICIANDO TPV EL FOGON DEL AGUILA (MODO NUBE)
echo ==========================================================
echo.
echo [1/3] Activando y proyectando en ambas pantallas...
displayswitch.exe /clone >nul 2>&1

echo [2/3] Optimizando energia para pantalla tactil...
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1
powercfg /change monitor-timeout-ac 0 >nul 2>&1
powercfg /change standby-timeout-ac 0 >nul 2>&1
powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0 >nul 2>&1
powercfg /setactive SCHEME_CURRENT >nul 2>&1

echo.
if exist .vercel_url (
    set /p vercel_url=<.vercel_url
) else (
    set vercel_url=https://fahma-pos.vercel.app
)
echo [3/3] Abriendo TPV en la nube: %vercel_url%
start "" "%vercel_url%"
echo.
echo Iniciando puente local de impresion...
cd /d "%~dp0backend"
node server.js
pause
