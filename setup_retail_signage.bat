@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo =========================================================
echo リテアド サイネージ（Kiosk）自動起動セットアップ
echo =========================================================
echo.
echo パソコン起動時に自動で「リテアド」の広告サイネージが
echo 全画面で立ち上がるように設定します。
echo.

:: パネル形状の選択メニュー
echo 【設置するLEDパネルの種類を選択してください】
echo  [1] 鮮魚対面ガラス用 (1000 × 300)
echo  [2] 冷蔵庫ドア用     (500 × 1000)
echo  [3] エンド上部用     (900 × 200)
echo  [4] 棚割り(電子棚札) (900 × 100)
echo  [5] 普通のテレビ・モニター (横型 16:9)
echo.
set /p PANEL_CHOICE="番号 (1-5) を入力してEnterを押してください: "

set "TARGET_URL=https://retail-ad.com/signage_player.html"

if "%PANEL_CHOICE%"=="1" (
    set "TARGET_URL=https://retail-ad.com/signage_player.html?panel=fish"
    echo =^> 「鮮魚対面ガラス用」で設定します。
) else if "%PANEL_CHOICE%"=="2" (
    set "TARGET_URL=https://retail-ad.com/signage_player.html?panel=fridge"
    echo =^> 「冷蔵庫ドア用」で設定します。
) else if "%PANEL_CHOICE%"=="3" (
    set "TARGET_URL=https://retail-ad.com/signage_player.html?panel=endcap"
    echo =^> 「エンド上部用」で設定します。
) else if "%PANEL_CHOICE%"=="4" (
    set "TARGET_URL=https://retail-ad.com/signage_player.html?panel=shelf"
    echo =^> 「棚割り用」で設定します。
) else (
    echo =^> 「通常のテレビ・モニター」で設定します。
)

echo.
pause

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=RetailAd_Signage.lnk"
set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "VBS_SCRIPT=%temp%\CreateShortcut.vbs"

:: Chromeの探索
if not exist "%CHROME_PATH%" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

if not exist "%CHROME_PATH%" (
    echo 【エラー】Google Chromeが見つかりません。
    echo まずはGoogle Chromeをインストールしてください。
    pause
    exit /b
)

echo.
echo 設定中...
echo URL: %TARGET_URL%

:: VBSスクリプトを使ってショートカットを作成
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%STARTUP_FOLDER%\%SHORTCUT_NAME%" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%CHROME_PATH%" >> "%VBS_SCRIPT%"
:: 引数にキオスクモード、初回起動チェックのバイパス、カメラの自動許可を追加
echo oLink.Arguments = "--kiosk """ ^& "%TARGET_URL%" ^& """ --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream --no-first-run --no-default-browser-check --disable-translate" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

:: VBS実行とクリーンアップ
cscript /nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%"

echo.
echo =========================================================
echo 完了しました！
echo =========================================================
echo 次回からWindowsが起動すると自動で指定されたパネルサイズに
echo 最適化されたサイネージが全画面展開されます。
echo ※終了したい場合は「 Alt + F4 」キーを押してください。
echo.
pause
