@echo off
chcp 65001 >nul
echo =========================================================
echo 監視モード起動中...
echo base_loop_videos フォルダを常に監視しています。
echo 新しい動画（15MB以上）が保存されると、自動的に圧縮を開始します。
echo この黒い画面は閉じずに開いたままにしておいてください。
echo 停止する場合はこの画面を閉じるか、「Ctrl + C」を押してください。
echo =========================================================
echo.
cd /d "%~dp0\.."

:loop
node compress_local_videos.js --quiet
:: 5秒待機してから再度チェック
timeout /t 5 >nul
goto loop
