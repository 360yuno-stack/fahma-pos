@echo off
title TPV EL FOGON DEL AGUILA - Modo Nube
cls
echo ==========================================================
echo   INICIANDO TPV EL FOGON DEL AGUILA (MODO NUBE)
echo ==========================================================
echo.
if exist .vercel_url (
    set /p vercel_url=<.vercel_url
) else (
    set vercel_url=https://fahma-pos.vercel.app
)
echo Abriendo TPV en la nube: %vercel_url%
start "" "%vercel_url%"
echo.
echo Iniciando puente local de impresion...
cd /d "%~dp0backend"
node server.js
pause
