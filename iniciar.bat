@echo off
cd /d "%~dp0"
echo Iniciando servidor de VentasApp...
echo Abre http://localhost:3000 en tu navegador
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
node server.js
pause
