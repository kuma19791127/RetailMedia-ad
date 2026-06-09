@echo off
setlocal enabledelayedexpansion
chcp 932 >nul

:: --- 管理者権限の自動取得（UACプロンプトの表示） ---
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 管理者権限が必要です。昇格プロンプトを表示します...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
:: ---------------------------------------------------

color 0B
echo =========================================================
echo リテアド 透明LEDサイネージ 自動セットアップツール
echo =========================================================
echo.
echo パソコンを「サイネージ専用端末」としてセットアップします。
echo このツールは以下の設定を自動で行います：
echo 1. パネル認識番号（固有ID）の付与と保存
echo 2. ブラウザのキオスクモード（全画面固定）での自動起動
echo 3. 【任意】USBポートの読み込み無効化（セキュリティ設定）
echo.
echo [注意] 個人のパソコンで実行する場合は、USB無効化の際に「N」を選択してください。
echo.
pause

:: 1. パネル認識番号の付与
echo.
echo ---------------------------------------------------------
echo [STEP 1] パネル認識番号（固有ID）の設定
echo ---------------------------------------------------------
set "panel_id="
set /p panel_id="店舗やパネルの固有IDを入力してください (例: STORE-A-001) [空白で自動生成]: "

if "%panel_id%"=="" (
    set "panel_id=PANEL-%RANDOM%-%RANDOM%"
    echo 固有IDを自動生成しました: !panel_id!
) else (
    echo 固有ID: !panel_id! を設定しました。
)

:: Cドライブ直下に設定フォルダを作成してIDを保存
mkdir "C:\RetailMedia" >nul 2>&1
echo {"terminal_id": "!panel_id!"} > "C:\RetailMedia\config.json"
echo [OK] 固有IDを C:\RetailMedia\config.json に保存しました。

:: 2. USBの無効化（選択式）
echo.
echo ---------------------------------------------------------
echo [STEP 2] セキュリティパッチ（USB無効化）の適用
echo ---------------------------------------------------------
echo サイネージパネルへの悪意あるUSB接続（ウイルス感染等）を防ぐため、
echo USBメモリの読み込みをOSレベルで無効化しますか？
echo ※マウスやキーボードはそのまま使用できます。
echo ※個人の作業用パソコンの場合は「N」を選択してください！
set /p disable_usb="USBポートを無効化しますか？ (Y/N): "

if /i "%disable_usb%"=="Y" (
    reg add "HKLM\SYSTEM\CurrentControlSet\Services\USBSTOR" /v Start /t REG_DWORD /d 4 /f >nul 2>&1
    echo [OK] USBストレージの読み込みを無効化しました（再起動後に有効になります）。
) else (
    echo [SKIP] USBの無効化をスキップしました。
)

:: 3. 自動起動（キオスクモード）の設定
echo.
echo ---------------------------------------------------------
echo [STEP 3] キオスクモード自動起動の設定
echo ---------------------------------------------------------
set "STARTUP_DIR=%ALLUSERSPROFILE%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_DIR%\RetailAd_Signage.lnk"
set "TARGET_URL=https://retail-ad.com/signage_player.html?terminal_id=!panel_id!"

set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if exist "%CHROME_PATH%" (
    set "BROWSER_PATH=%CHROME_PATH%"
    echo [OK] Google Chrome を使用します。
) else (
    set "BROWSER_PATH=%EDGE_PATH%"
    echo [OK] Microsoft Edge を使用します。
)

:: ブラウザをキオスクモードで起動するショートカットを作成 (VBScriptを使用)
set "VBS_SCRIPT=%TEMP%\CreateShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%SHORTCUT_PATH%" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%BROWSER_PATH%" >> "%VBS_SCRIPT%"
echo oLink.Arguments = "--kiosk ""%TARGET_URL%"" --kiosk-type=fullscreen --autoplay-policy=no-user-gesture-required" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"
cscript //nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%"

echo [OK] ブラウザのキオスクモード自動起動ショートカットを作成しました。
echo 接続先URL: %TARGET_URL%

echo.
echo =========================================================
echo ? セットアップがすべて完了しました！
echo =========================================================
echo 次回パソコンを再起動すると、自動的に全画面でサイネージが起動し、
echo 広告の配信と収益計測が開始されます。
echo ※テストを終了して元に戻したい場合は、「remove_retail_signage.bat」を実行してください。
echo.
pause
