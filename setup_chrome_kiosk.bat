@echo off
chcp 65001 > nul
set "URL=https://nsg3hyme2k.us-east-1.awsapprunner.com/signage_player.html"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo ==================================================
echo   リテアド Chromeキオスク自動起動設定ツール
echo ==================================================
echo.
echo パソコンの電源を入れた際に、自動的にGoogle Chromeが
echo 全画面表示（キオスクモード）でサイネージプレイヤーを
echo 開くように設定を行います。
echo.
pause

powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTUP_DIR%\LiteAd_Chrome_Kiosk.lnk'); $Shortcut.TargetPath = 'chrome.exe'; $Shortcut.Arguments = '--kiosk %URL%'; $Shortcut.Save()"

echo.
echo 🎉 設定が完了しました！
echo PCを再起動するか、次回の起動時から自動でサイネージが再生されます。
echo.
pause
