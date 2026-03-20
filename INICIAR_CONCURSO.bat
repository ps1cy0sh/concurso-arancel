@echo off
setlocal enabledelayedexpansion

:: Asegurar que estamos trabajando en la carpeta donde esta el archivo .bat
cd /d "%~dp0"

TITLE INICIAR CONCURSO ARANCELARIA - SOPORTE TECNICO

echo ======================================================
echo    BIENVENIDO AL CONFIGURADOR DEL CONCURSO
echo ======================================================
echo.

:: Detectar la IP Local de forma robusta
set "MY_IP=localhost"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "val=%%a"
    :: Quitar espacios
    set "val=!val: =!"
    :: Si no esta vacio, guardarlo (tomamos el primero que encontremos)
    if not "!val!"=="" (
        set "MY_IP=!val!"
        goto :found_ip
    )
)
:found_ip

echo [INFO] Tu direccion IP detectada es: %MY_IP%
echo.

:: 1. Verificar si Node.js esta instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] No hemos detectado Node.js en esta computadora.
    echo.
    echo Pasos a seguir:
    echo 1. Ve a https://nodejs.org/
    echo 2. Descarga e instala la version que dice "LTS".
    echo 3. Reinicia tu computadora y vuelve a abrir este archivo.
    echo.
    pause
    exit
)

echo [OK] Node.js detectado.
echo.

:: 2. Verificar que las carpetas existen
if not exist "backend" (
    echo [ERROR] No se encuentra la carpeta 'backend'. 
    pause
    exit
)
if not exist "frontend" (
    echo [ERROR] No se encuentra la carpeta 'frontend'.
    pause
    exit
)

:: 3. Instalar librerias (Backend)
echo [1/3] Preparando Backend...
pushd backend
if not exist node_modules (
    echo Instalando librerias por primera vez...
    call npm install --no-audit --no-fund
)
popd

:: 4. Instalar librerias (Frontend)
echo [2/3] Preparando Frontend...
pushd frontend
if not exist node_modules (
    echo Instalando librerias por primera vez...
    call npm install --no-audit --no-fund
)
popd

:: 5. Iniciar todo con --host explicito
echo [3/3] Iniciando el Concurso...
echo.
echo ======================================================
echo    EL JUEGO SE ESTA LANZANDO CON ACCESO DE RED...
echo.
echo    DIRECCION PARA LOS ALUMNOS (Copia esto):
echo    http://%MY_IP%:5173
echo.
echo    La ventana del Administrador se abrira sola.
echo    IMPORTANTE: No cierres las ventanas negras.
echo ======================================================
echo.

:: Iniciar Backend en ventana minimizada (Escuchando en 0.0.0.0)
start /min "SERVIDOR_BACKEND" cmd /c "cd /d "%~dp0backend" && node server.js"

:: Esperar
timeout /t 4 /nobreak >nul

:: Abrir navegador en la IP local para verificar
start http://localhost:5173

:: Iniciar Frontend forzando --host para visibilidad en red
cd /d "%~dp0frontend"
call npx vite --host

pause
