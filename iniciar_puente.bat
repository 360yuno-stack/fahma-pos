@echo off
title TPV EL FOGON DEL AGUILA
cls
echo ==========================================================
echo   SELECCIONE COMO DESEA INICIAR EL TPV
echo ==========================================================
echo.
echo  [1] Iniciar TPV LOCAL (Recomendado - Sin Internet / Sin fallos)
echo  [2] Iniciar SOLO Puente de Impresion (Para usar TPV en la Nube Vercel)
echo  [3] Salir
echo.
set /p opcion="Seleccione una opcion (1-3): "

if "%opcion%"=="1" goto local
if "%opcion%"=="2" goto nube
if "%opcion%"=="3" goto salir
goto salir

:local
echo.
echo Iniciando TPV en modo LOCAL...
echo.
echo [1/2] Iniciando backend de base de datos e impresiones (Puerto 5000)...
start "Backend - FAHMA POS" /min cmd /c "cd /d %~dp0backend && node server.js"
echo [2/2] Iniciando cliente web local (Puerto 5173)...
start "Frontend - FAHMA POS" /min cmd /c "cd /d %~dp0frontend && call npm run dev"
echo.
echo Esperando a que carguen los modulos locales...
timeout /t 4 /nobreak > nul
start "" "http://localhost:5173"
echo.
echo ==========================================================
echo   TPV Local iniciado con exito!
echo   No cierre esta ventana ni las ventanas minimizadas.
echo ==========================================================
echo.
pause
goto salir

:nube
echo.
echo Iniciando Puente de Impresion para la Nube...
echo.
if exist .vercel_url (
    set /p vercel_url=<.vercel_url
) else (
    set vercel_url=https://fahma-pos.vercel.app
)
echo.
echo Abriendo TPV en la nube: %vercel_url%
start "" "%vercel_url%"
cd /d "%~dp0backend"
node server.js
pause
goto salir

:salir
exit
