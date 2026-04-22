@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo =========================================================
echo Retail Media サイネージ自動起動セットアップ (冷蔵庫ドア (500x1000))
echo =========================================================
echo.
echo このパソコンを「冷蔵庫ドア (500x1000)専用」のサイネージとして設定します。
echo 設定が完了すると、次回以降は「電源を入れるだけ」で
echo 全自動で動画配信がスタートするようになります。
echo.
echo 設定中...

set "TARGET_URL=https://retail-ad.com/signage_player.html?panel=fridge"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=RetailAd_Signage_fridge.lnk"
set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "VBS_SCRIPT=%temp%\CreateShortcut.vbs"

:: Chromeのパス確認
if not exist "%CHROME_PATH%" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

if not exist "%CHROME_PATH%" (
    echo 【エラー】Google Chromeが見つかりません。
    echo Chromeをインストールしてから再度実行してください。
    pause
    exit /b
)

:: 古いショートカットがあれば削除
if exist "%STARTUP_FOLDER%\RetailAd_Signage*.lnk" (
    del "%STARTUP_FOLDER%\RetailAd_Signage*.lnk"
)

:: VBSスクリプトでショートカット作成
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%STARTUP_FOLDER%\%SHORTCUT_NAME%" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%CHROME_PATH%" >> "%VBS_SCRIPT%"
echo oLink.Arguments = "--kiosk """ ^& "%TARGET_URL%" ^& """ --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream --no-first-run --no-default-browser-check --disable-translate" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

cscript /nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%"

echo.
echo =========================================================
echo ✅ 冷蔵庫ドア (500x1000)の設定が完了しました！
echo =========================================================
echo 今後、このパソコンは電源を入れるだけで自動的に
echo サイネージ画面が立ち上がり、動画配信を開始します。
echo （終了したい場合はキーボードの「Alt + F4」を押してください）
echo.
echo それでは、テストとしてサイネージ画面を起動します...
timeout /t 3 >nul

:: テスト起動
start "" "%CHROME_PATH%" --kiosk "%TARGET_URL%" --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream --no-first-run --no-default-browser-check --disable-translate

exit /b
