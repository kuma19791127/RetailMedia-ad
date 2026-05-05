@echo off
title LiteAd System Server
color 0B

echo ========================================================
echo Starting Retail Media System Server...
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Checking modules (npm install)...
if not exist "node_modules\" (
    echo First run: installing modules...
    call npm install >nul 2>&1
) else (
    echo Modules already installed.
)

echo.
echo [2/2] Starting server (start http://localhost:3000/admin\nnode server_retail_dist.js)...
echo.
echo === Login Portal: http://localhost:3000/ ===
echo ========================================================
echo.

node server_retail_dist.js

echo.
echo Server stopped.
pause
