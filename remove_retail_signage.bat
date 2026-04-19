@echo off
chcp 65001 >nul
echo =========================================================
echo リテアド サイネージ 自動起動【解除】スクリプト
echo =========================================================
echo.
echo パソコン起動時の「Chrome全画面自動起動」設定を解除します。
echo 普通のパソコンとして使いたい場合や、設定をやり直す場合に使用してください。
echo.
pause

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=RetailAd_Signage.lnk"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\%SHORTCUT_NAME%"

if exist "%SHORTCUT_PATH%" (
    echo 解除中... 自動起動設定を削除しています。
    del "%SHORTCUT_PATH%"
    echo.
    echo =========================================================
    echo 設定の解除が完了しました！
    echo =========================================================
    echo 次回パソコンを再起動した際からは、通常のWindows画面のままになります。
) else (
    echo.
    echo =========================================================
    echo 【お知らせ】設定が見つかりませんでした。
    echo =========================================================
    echo そもそも自動起動設定がなされていないか、既に解除されています。
)

echo.
pause
