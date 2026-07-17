@echo off
title Instalador TPV El Fogon del Aguila
echo ==========================================================
echo   INICIANDO INSTALADOR AUTOMATICO CON PERMISOS BYPASS
echo ==========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_caja.ps1"
echo.
echo ==========================================================
echo   Proceso finalizado. Presione una tecla para cerrar.
echo ==========================================================
pause
