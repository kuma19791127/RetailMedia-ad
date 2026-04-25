@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo =========================================================
echo Retail Media サイネージ自動起動セットアップ
echo =========================================================
echo.
echo このパソコンを「サイネージ専用端末」として設定します。
echo 設定が完了すると、次回以降は「電源を入れるだけ」で
echo 全自動で動画配信がスタートするようになります。
echo.
echo 設定中...

set "TARGET_URL=https://retail-ad.com/signage_player.html"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=RetailAd_Signage.lnk"
set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "VBS_SCRIPT=%temp%\CreateShortcut.vbs"


:: --- セキュリティ＆ランサムウェア対策 (管理者権限が必要) ---
echo.
echo 【セキュリティ設定】
echo USBメモリの無効化と、サイネージ専用ユーザーの作成を行いますか？
echo （※管理者として実行している場合のみ機能します。個人PCの場合は N を推奨）
set /p DO_SECURE="設定を適用しますか？ (Y/N): "
if /I "%DO_SECURE%"=="Y" (
    echo [1/2] USBメモリ（マスストレージ）を無効化しています...
    reg add "HKLM\SYSTEM\CurrentControlSet\Services\USBSTOR" /v Start /t REG_DWORD /d 4 /f >nul 2>&1
    if !errorlevel! neq 0 (
        echo [エラー] 管理者権限がありません。右クリックから「管理者として実行」してください。
    ) else (
        echo [OK] USBメモリを無効化しました（マウス・キーボードは使えます）。
        
        echo [2/2] サイネージ専用の一般ユーザー（権限制限）を作成しています...
        net user SignagePlayer Signage123! /add >nul 2>&1
        net localgroup Users SignagePlayer /add >nul 2>&1
        
        :: 自動ログインの設定
        reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v AutoAdminLogon /t REG_SZ /d 1 /f >nul
        reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultUserName /t REG_SZ /d "SignagePlayer" /f >nul
        reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultPassword /t REG_SZ /d "Signage123!" /f >nul
        
        echo [OK] 一般ユーザー「SignagePlayer」を作成し、自動ログインを設定しました。
        echo 次回の再起動から、管理者権限のない安全なアカウントで起動します。
    )
)
:: -----------------------------------------------------

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
echo ✅ セットアップが完了しました！
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
