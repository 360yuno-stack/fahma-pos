@echo off
title Puente de Impresion - FAHMA POS
echo ==========================================================
echo   PUENTE DE IMPRESION LOCAL - EL FOGON DEL AGUILA
echo ==========================================================
echo.
echo No cierre esta ventana para mantener activas las impresoras.
echo.
start "" "https://fahma-pos.vercel.app"
cd /d "%~dp0backend"
node server.js
echo.
pause
