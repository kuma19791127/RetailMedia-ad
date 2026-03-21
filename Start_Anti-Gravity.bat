@echo off
cd /d "%~dp0"

echo Stopping old server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo Starting Browser...
start http://localhost:3000/Anti-Gravity.html#corp
timeout /t 2 >nul

echo Starting Anti-Gravity Server...
node server_retail_dist.js

echo Server crashed or stopped.
pause
