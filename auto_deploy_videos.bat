@echo off
echo =========================================================
echo ? 動画の自動圧縮 ＆ クラウド(AWS)への自動プッシュを開始します
echo =========================================================
echo.

echo [1/3] 動画の圧縮をチェック中...
node compress_local_videos.js --quiet

echo.
echo [2/3] クラウドへ送る準備(Git Commit)...
git add -f base_loop_videos/*_compressed.mp4 >nul 2>&1
git commit -m "Auto-deploy: Upload compressed videos to signage"

echo.
echo [3/3] クラウド(AWS)へアップロード中...
git push

echo.
echo =========================================================
echo ? 全ての作業が完了しました！数分後にAWSサイネージに反映されます。
echo =========================================================
pause
