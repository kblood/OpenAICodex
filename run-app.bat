@echo off
echo OpenMaps Setup and Run Script
echo =============================
echo.

echo Step 1: Extract Tilemaker
echo -------------------------
if exist "tilemaker-windows.zip" (
    echo Found tilemaker-windows.zip
    if not exist "tilemaker" mkdir tilemaker
    echo Please manually extract tilemaker-windows.zip to the tilemaker folder
    echo You can:
    echo   1. Right-click tilemaker-windows.zip
    echo   2. Select "Extract All..."
    echo   3. Extract to the "tilemaker" folder
    echo.
    pause
) else (
    echo tilemaker-windows.zip not found in current directory
)

echo Step 2: Start the server
echo -------------------------
if exist "server.js" (
    echo Starting Node.js server...
    node server.js
) else (
    echo server.js not found
)

pause
