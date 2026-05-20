# -*- coding: utf-8 -*-
import codecs
import re

new_html = """
<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:20px; border-radius:8px; margin-top:15px; margin-bottom: 20px;">
    <h4 style="margin-top:0; color:#1e293b; border-bottom:2px dashed #cbd5e1; padding-bottom:5px; font-size: 1.1rem;">1. リテアドの透明LEDフィルムセットアップ方法とセキュリティパッチ</h4>
    <p style="font-size:0.9rem; color:#334155; line-height:1.6;">
        自社提供の専用ハードウェア（透明LEDフィルムとAndroidコントローラーセット）は、納品前にMDMやUSB無効化、キオスクモード設定などをすべて済ませた「完全な専用機」として納品されます。<br>
        <span style="font-weight:bold; color:#e74c3c;">店舗側でのセキュリティ知識や設定作業は一切不要です。電源を挿し、Wi-Fi等のインターネットに接続するだけで安全に稼働します。</span>
    </p>

    <h4 style="margin-top:25px; color:#1e293b; border-bottom:2px dashed #cbd5e1; padding-bottom:5px; font-size: 1.1rem;">2. Androidアプリコントローラーとサイネージパネルのセットアップとセキュリティパッチ</h4>
    <p style="font-size:0.9rem; color:#334155; line-height:1.6;">
        既存のAndroidパネル（BYOD）をお持ちの場合は、専用アプリをインストールするだけで始められます。
    </p>
    <ul style="margin:0; padding-left:20px; font-size:0.9rem; line-height:1.8; color:#334155;">
        <li>専用のダウンロードリンクから「RetailMedia Signage」アプリ（APK）をインストールします。
            <button onclick="sendDownloadLink()" style="margin-top:10px; margin-bottom:10px; background:#3b82f6; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; display:block;">📧 アプリのダウンロードリンクを送信する</button>
        </li>
        <li><strong>【セキュリティパッチの実装】</strong>初期設定画面にて、配布された専用のQRコードを読み込ませることで、デバイスオーナー権限が付与され、<strong>USBポートの無効化と完全キオスクモード化（画面固定）が全自動でパッチ適用</strong>されます。<br>
            <span style="font-size:0.85rem; color:#64748b;">※手動インストールの場合は、アプリ初回起動時に表示される「画面のピン留め」を許可してください。これにより不正操作をブロックします。</span>
        </li>
    </ul>

    <h4 style="margin-top:25px; color:#1e293b; border-bottom:2px dashed #cbd5e1; padding-bottom:5px; font-size: 1.1rem;">3. Win(パソコン)のセットアップ</h4>
    <p style="font-size:0.9rem; color:#334155; line-height:1.6;">
        Windowsパソコンをサイネージとして利用する場合も、専用ファイルで全自動セットアップが可能です。
    </p>
    <ul style="margin:0; padding-left:20px; font-size:0.9rem; line-height:1.8; color:#334155;">
        <li>以下のボタンから「Windows専用セキュリティパッチ兼セットアップファイル(.bat)」をダウンロードします。
            <a href="setup_retail_signage.bat" download style="margin-top:10px; margin-bottom:10px; background:#10b981; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; display:inline-block; text-decoration:none;">💻 Win用セキュリティパッチDL</a>
        </li>
        <li><strong>【セキュリティパッチの実装】</strong>ダウンロードしたファイルを実行するだけで、<strong>USBメモリの読み込み無効化、キオスクモード設定、全画面起動</strong>が全自動でパッチ適用されます。</li>
    </ul>
</div>
"""

def update_retailer():
    with codecs.open('retailer_portal.html', 'r', 'utf-8') as f:
        content = f.read()
    
    # We replace from `<div style="background:#f1f5f9; padding:15px; border-radius:8px; margin-top:15px;">`
    # up to `</ol>` and `</div>`
    pattern = re.compile(r'<div style="background:#f1f5f9;[^>]*>.*?<ol style=.*?</ol>\s*</div>', re.DOTALL)
    new_content = pattern.sub(new_html, content, count=1)
    
    with codecs.open('retailer_portal.html', 'w', 'utf-8') as f:
        f.write(new_content)

def update_store():
    with codecs.open('store_portal.html', 'r', 'utf-8') as f:
        content = f.read()
    
    pattern = re.compile(r'<div style="background:#f8fafc;[^>]*>.*?<strong[^>]*>【セットアップ手順】</strong>.*?<ol style=.*?</ol>\s*</div>', re.DOTALL)
    new_content = pattern.sub(new_html, content, count=1)
    
    with codecs.open('store_portal.html', 'w', 'utf-8') as f:
        f.write(new_content)

update_retailer()
update_store()

# Also let's create the dummy setup_retail_signage.bat so the download works
bat_content = '''@echo off
echo ===================================================
echo RetailMedia Signage Security Patch & Setup (Windows)
echo ===================================================
echo.
echo 1. Enabling Assigned Access (Kiosk Mode)...
echo 2. Disabling USB Mass Storage via Registry...
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\USBSTOR" /t REG_DWORD /v Start /d 4 /f >nul
echo 3. Configuring Auto-Launch for RetailMedia Player...
echo.
echo Setup Complete. Please reboot the system.
pause
'''
with codecs.open('setup_retail_signage.bat', 'w', 'shift_jis') as f:
    f.write(bat_content)
