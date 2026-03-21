@echo off
chcp 65001 >nul
echo ===================================================
echo   Anti-Gravity サーバー起動＆自動再起動ツール
echo ===================================================
echo.
echo [1/3] 古いサーバープロセスを探して停止しています...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr "0.0.0.0:3000"') do (
    if NOT "%%a"=="0" (
        taskkill /F /PID %%a >nul 2>&1
    )
)
timeout /t 2 >nul

echo [2/3] 新しいサーバーを起動しています...
start /b node server_retail_dist.js

echo.
echo [3/3] ブラウザでアプリを開きます...
timeout /t 3 >nul
start http://localhost:3000/ag-login

echo.
echo 起動が完了しました！この黒い画面は閉じないでください。
echo （閉じた場合はサーバーが終了します）
pause
