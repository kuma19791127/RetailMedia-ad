@echo off
chcp 65001 >nul
echo =========================================================
echo base_loop_videos フォルダ内の動画を一括圧縮します
echo （15MB以上の動画を自動で圧縮して上書きします）
echo =========================================================
echo.
cd /d "%~dp0"
node compress_local_videos.js
echo.
pause
