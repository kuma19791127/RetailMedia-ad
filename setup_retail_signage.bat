@echo off
chcp 65001 >nul
echo =========================================================
echo リテアド サイネージ（Kiosk）自動起動セットアップ
echo =========================================================
echo.
echo パソコン起動時に自動で「リテアド」の広告サイネージが
echo 全画面で立ち上がるようにWindowsを設定します。
echo.
pause

set "TARGET_URL=https://retail-ad.com/signage_player.html"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=RetailAd_Signage.lnk"
set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "VBS_SCRIPT=%temp%\CreateShortcut.vbs"

:: Chrome（64bit版/32bit版）の探索
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
echo Chromeの場所: %CHROME_PATH%

:: VBSスクリプトを使ってショートカットを作成
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%STARTUP_FOLDER%\%SHORTCUT_NAME%" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%CHROME_PATH%" >> "%VBS_SCRIPT%"
:: 引数にキオスクモード、初回起動チェックのバイパス、カメラの自動許可を追加
echo oLink.Arguments = "--kiosk """ ^& "%TARGET_URL%" ^& """ --use-fake-ui-for-media-stream --no-first-run --no-default-browser-check --disable-translate" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

:: VBS実行とクリーンアップ
cscript /nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%"

echo.
echo =========================================================
echo 完了しました！
echo =========================================================
echo 次回からWindowsが起動（または再起動）すると、パスワード画面通過後に
echo 自動でChromeが立ち上がり、全画面でサイネージが展開されます。
echo カメラの許可ポップアップも自動でクリア（許可）されます。
echo.
echo ※サイネージ画面（全画面）を終了したい場合は、
echo 　キーボードで「 Alt 」キーを押しながら「 F4 」キーを押してください。
echo.
pause
