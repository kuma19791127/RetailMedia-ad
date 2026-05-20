import codecs

new_setup_html = """<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:20px; border-radius:8px; margin-top:15px; margin-bottom: 20px;">
    <h4 style="margin-top:0; color:#1e293b; border-bottom:2px dashed #cbd5e1; padding-bottom:5px; font-size: 1.1rem;">1. リテアドの透明LEDフィルム<br class="mobile-br">セットアップ方法と<br class="mobile-br">セキュリティパッチ</h4>
    <p style="font-size:0.9rem; color:#334155; line-height:1.6;">
        自社提供の専用ハードウェア<br class="mobile-br">（透明LEDフィルムと<br class="mobile-br">Androidコントローラー）は、<br class="mobile-br">納品前にMDMやUSB無効化、<br class="mobile-br">キオスクモード設定などを<br class="mobile-br">すべて済ませた「完全な専用機」<br class="mobile-br">として納品されます。<br>
        <span style="font-weight:bold; color:#e74c3c;">店舗側でのセキュリティ知識や<br class="mobile-br">設定作業は一切不要です。<br class="mobile-br">電源を挿し、Wi-Fi等の<br class="mobile-br">インターネットに接続するだけで<br class="mobile-br">安全に稼働します。</span>
    </p>
    <button onclick="sendDownloadLink()" style="margin-top:10px; margin-bottom:10px; background:#3b82f6; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; display:block;">📧 アプリのダウンロードリンクを送信する</button>

    <h4 style="margin-top:25px; color:#1e293b; border-bottom:2px dashed #cbd5e1; padding-bottom:5px; font-size: 1.1rem;">2. Androidアプリと<br class="mobile-br">サイネージパネルのセットアップと<br class="mobile-br">セキュリティパッチ</h4>
    <p style="font-size:0.9rem; color:#334155; line-height:1.6;">
        既存のAndroidコントローラーと<br class="mobile-br">サイネージパネルをお持ちの場合は<br class="mobile-br">専用アプリをインストールするだけで<br class="mobile-br">始められます。
    </p>
    <ul style="margin:0; padding-left:20px; font-size:0.9rem; line-height:1.8; color:#334155;">
        <li>専用のダウンロードリンクから<br class="mobile-br">「RetailMedia Signage」アプリ<br class="mobile-br">（APK）をインストールします。</li>
        <li><strong>【セキュリティパッチの実装】</strong><br class="mobile-br">初期設定画面にて、配布された<br class="mobile-br">専用のQRコードを読み込ませる<br class="mobile-br">ことで、デバイスオーナー権限が<br class="mobile-br">付与され、<strong>USBポートの無効化と<br class="mobile-br">完全キオスクモード化（画面固定）が<br class="mobile-br">全自動でパッチ適用</strong>されます。<br>

    <div style="margin-top:15px; padding:15px; background:#fff; border:1px solid #e2e8f0; border-radius:5px; text-align:center;">
        <strong style="color:#1e293b; display:block; margin-bottom:10px;">📱 Androidセットアップ用 プロビジョニングQRコード</strong>
        <div id="mdm-qr-code" style="display:inline-block; padding:10px; background:white; border:2px solid #cbd5e1; border-radius:8px;"></div>
        <p style="font-size:0.8rem; color:#64748b; margin-top:10px;">※初期化されたAndroid端末の「こんにちは」画面を6回連続タップし、このQRコードを読み込ませてください。</p>
    </div>
    <script>
        const mdmPayload = {
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.retailmedia.signage/.AdminReceiver",
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://retail-media-db-2026.s3.us-east-1.amazonaws.com/app-debug.apk",
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "Q2BraJOWHeEztZTZjjmwHvUDFsLGGDYVeQ-l7945ehQ",
            "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true
        };
        setTimeout(function() {
            if(document.getElementById('mdm-qr-code') && typeof QRCode !== 'undefined') {
                document.getElementById('mdm-qr-code').innerHTML = '';
                new QRCode(document.getElementById('mdm-qr-code'), {
                    text: JSON.stringify(mdmPayload),
                    width: 150,
                    height: 150,
                    colorDark : '#000000',
                    colorLight : '#ffffff',
                    correctLevel : QRCode.CorrectLevel.L
                });
            }
        }, 500);
    </script>
    
            <span style="font-size:0.85rem; color:#64748b;">※手動インストールの場合は<br class="mobile-br">アプリ初回起動時に表示される<br class="mobile-br">「画面のピン留め」を許可してください。<br class="mobile-br">これにより不正操作をブロックします。</span>
        </li>
    </ul>

    <h4 style="margin-top:25px; color:#1e293b; border-bottom:2px dashed #cbd5e1; padding-bottom:5px; font-size: 1.1rem;">3. Win(パソコン)のセットアップ</h4>
    <p style="font-size:0.9rem; color:#334155; line-height:1.6;">
        Windowsパソコンをサイネージ<br class="mobile-br">として利用する場合も、専用ファイル<br class="mobile-br">で全自動セットアップが可能です。
    </p>
    <ul style="margin:0; padding-left:20px; font-size:0.9rem; line-height:1.8; color:#334155;">
        <li>以下のボタンから「Windows専用<br class="mobile-br">セキュリティパッチ兼<br class="mobile-br">セットアップファイル(.bat)」<br class="mobile-br">をダウンロードします。
            <a href="https://retail-media-db-2026.s3.us-east-1.amazonaws.com/setup_retail_signage.bat" download style="margin-top:10px; margin-bottom:10px; background:#10b981; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; display:inline-block; text-decoration:none;">💻 Win用セキュリティパッチDL</a>
        </li>
        <li><strong>【セキュリティパッチの実装】</strong><br class="mobile-br">ダウンロードしたファイルを実行<br class="mobile-br">するだけで、<strong>USBメモリの<br class="mobile-br">読み込み無効化、キオスク<br class="mobile-br">モード設定、全画面起動</strong>が<br class="mobile-br">全自動でパッチ適用されます。</li>
    </ul>

    <h4 style="margin-top:25px; color:#0f172a; border-left:4px solid #f59e0b; padding-left:10px; font-size: 1.1rem;">4. セキュリティパッチを<br class="mobile-br">利用しない場合<br class="mobile-br">（初期化できないサイネージパネル）</h4>
    <p style="font-size:0.95rem; color:#475569; line-height:1.6; margin-bottom:15px;">
        業務で既に使用している<br class="mobile-br">サイネージパネルや<br class="mobile-br">スマートフォンなど、端末を<br class="mobile-br">初期化できない場合は、QRコード<br class="mobile-br">による全自動セキュリティ設定<br class="mobile-br">（完全キオスクモード）は<br class="mobile-br">ご利用いただけません。<br>
        その場合は、手動でアプリを<br class="mobile-br">インストールし、Android標準の<br class="mobile-br">機能である「画面のピン留め」<br class="mobile-br">機能をご利用ください。
    </p>

    <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:15px;">
        <strong style="color:#334155; display:block; margin-bottom:10px;">【手動インストールと固定化の手順】</strong>
        <ol style="margin:0; padding-left:20px; font-size:0.9rem; line-height:1.8; color:#334155;">
            <li>以下のボタンから<br class="mobile-br">Android用アプリ<br class="mobile-br">（APKファイル）を端末に<br class="mobile-br">直接ダウンロードして<br class="mobile-br">インストールしてください。<br>
                <a href="https://retail-media-db-2026.s3.us-east-1.amazonaws.com/app-debug.apk" download style="margin-top:10px; margin-bottom:10px; background:#f59e0b; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; display:inline-block; text-decoration:none;">📱 Android用アプリを手動でDL</a>
            </li>
            <li>アプリのインストール後<br class="mobile-br">Androidの「設定」アプリを<br class="mobile-br">開き、「セキュリティ」＞<br class="mobile-br">「詳細設定（またはその他の<br class="mobile-br">セキュリティ設定）」＞<br class="mobile-br"><strong>「画面のピン留め」</strong> をオンにします。</li>
            <li>リテアドのサイネージアプリを<br class="mobile-br">起動した状態で、タスク一覧<br class="mobile-br">（起動中のアプリ一覧）を開き、<br class="mobile-br">アプリアイコンをタップして<br class="mobile-br">「ピン留め」を選択します。</li>
        </ol>
    </div>

    <div style="background:#fff7ed; padding:15px; border-radius:8px; border:1px solid #ffedd5;">
        <strong style="color:#9a3412; display:block; margin-bottom:10px;">【運用のメリットと注意点】</strong>
        <ul style="margin:0; padding-left:20px; font-size:0.9rem; line-height:1.8; color:#9a3412;">
            <li>ピン留めを行うと<br class="mobile-br">戻るボタンとホームボタンの<br class="mobile-br">ボタンの同時長押し等を<br class="mobile-br">行わない限り<br class="mobile-br">サイネージ画面から<br class="mobile-br">ホーム画面に戻れなくなるため<br class="mobile-br">店頭でのイタズラ防止に<br class="mobile-br">十分役立ちます。</li>
            <li>業務で使用する際は<br class="mobile-br">店員様ご自身でピン留めを解除<br class="mobile-br">することで、普段通り他の<br class="mobile-br">サイネージを<br class="mobile-br">ご利用いただけます。</li>
            <li><strong>※重要※</strong><br class="mobile-br">USBポートの自動無効化は<br class="mobile-br">適用されません。<br class="mobile-br">USBポートにテープを貼ったり<br class="mobile-br">配線部分をカバーで覆うなどの<br class="mobile-br">物理ブロックを推奨します。<br class="mobile-br">セキュリティに<br class="mobile-br">ご注意ください。</li>
        </ul>
    </div>
</div>"""

files = ['retailer_portal.html', 'store_portal.html']

for f_path in files:
    with codecs.open(f_path, 'r', 'utf-8') as f:
        text = f.read()
    
    start_str = '<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:20px; border-radius:8px; margin-top:15px; margin-bottom: 20px;">'
    start_idx = text.find(start_str)
    
    if start_idx != -1:
        # Find the end of the section by looking for the last </div>
        # "【運用のメリットと注意点】" is part of the inner div.
        merit_idx = text.find('【運用のメリットと注意点】', start_idx)
        if merit_idx != -1:
            end_idx_1 = text.find('</div>', merit_idx)
            end_idx_2 = text.find('</div>', end_idx_1 + 1)
            end_idx = end_idx_2 + 6
            text = text[:start_idx] + new_setup_html + text[end_idx:]
            
            with codecs.open(f_path, 'w', 'utf-8') as f:
                f.write(text)
            print(f"Successfully updated {f_path}")
        else:
            print("merit block not found")
    else:
        print(f"Could not find start index in {f_path}")
