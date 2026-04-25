@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: --- 管理者権限の自動取得（UACプロンプトの表示） ---
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 管理者権限が必要です。昇格プロンプトを表示します...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
:: ---------------------------------------------------

echo =========================================================
echo リテアド サイネージ 自動起動＆セキュリティ【完全解除】スクリプト
echo =========================================================
echo.
echo パソコンを「サイネージ専用端末」から「通常のパソコン」に戻します。
echo ・自動起動設定の削除
echo ・USBメモリの利用制限の解除
echo ・サイネージ専用アカウント(SignagePlayer)の削除と自動ログインの解除
echo を行います。
echo.
pause

:: 1. ショートカットの削除 (新旧両方のパスをチェック)
set "STARTUP_ALL=%ALLUSERSPROFILE%\Microsoft\Windows\Start Menu\Programs\Startup\RetailAd_Signage.lnk"
set "STARTUP_USER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\RetailAd_Signage.lnk"

if exist "%STARTUP_ALL%" del "%STARTUP_ALL%"
if exist "%STARTUP_USER%" del "%STARTUP_USER%"
echo [OK] 自動起動のショートカットを削除しました。

:: 2. USBメモリの無効化を解除 (デフォルト値の 3 に戻す)
reg add "HKLM\SYSTEM\CurrentControlSet\Services\USBSTOR" /v Start /t REG_DWORD /d 3 /f >nul 2>&1
echo [OK] USBメモリの利用制限を解除しました。

:: 3. 自動ログインの解除
reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v AutoAdminLogon /t REG_SZ /d 0 /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultUserName /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultPassword /f >nul 2>&1
echo [OK] 自動ログイン設定を解除しました。

:: 4. 専用ユーザーの削除
net user SignagePlayer /delete >nul 2>&1
echo [OK] サイネージ専用ユーザー(SignagePlayer)を削除しました。

echo.
echo =========================================================
echo ✅ すべての解除が完了しました！元のパソコンに戻りました。
echo =========================================================
echo 次回再起動時からは、通常のパスワード入力画面（ログイン画面）が表示され、
echo 動画の自動再生も行われません。
echo.
pause
