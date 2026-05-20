# -*- coding: utf-8 -*-
import codecs

def update_html(filename):
    with codecs.open(filename, 'r', 'utf-8') as f:
        content = f.read()
    
    # 1. Replace the BAT link
    new_link = 'https://retail-media-db-2026.s3.us-east-1.amazonaws.com/setup_retail_signage.bat'
    content = content.replace('href="setup_retail_signage.bat"', f'href="{new_link}"')
    
    # 2. Add actual QR code generation to the HTML
    # First, let's include qrcode.js in the head if not present, or just directly in the HTML where the QR code goes.
    qr_js_cdn = '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>'
    if 'qrcode.min.js' not in content:
        content = content.replace('</head>', f'{qr_js_cdn}\n</head>')
    
    qr_html = '''
    <div style="margin-top:15px; padding:15px; background:#fff; border:1px solid #e2e8f0; border-radius:5px; text-align:center;">
        <strong style="color:#1e293b; display:block; margin-bottom:10px;">📱 Androidセットアップ用 プロビジョニングQRコード</strong>
        <div id="mdm-qr-code" style="display:inline-block; padding:10px; background:white; border:2px solid #cbd5e1; border-radius:8px;"></div>
        <p style="font-size:0.8rem; color:#64748b; margin-top:10px;">※初期化されたAndroid端末の「こんにちは」画面を6回連続タップし、このQRコードを読み込ませてください。</p>
    </div>
    <script>
        // Android Enterprise Provisioning JSON Payload
        const mdmPayload = {
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.retailmedia.signage/.AdminReceiver",
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://retail-media-db-2026.s3.us-east-1.amazonaws.com/app-debug.apk",
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "DUMMY_CHECKSUM_UPDATE_LATER",
            "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true
        };
        setTimeout(() => {
            if(document.getElementById("mdm-qr-code")) {
                document.getElementById("mdm-qr-code").innerHTML = "";
                new QRCode(document.getElementById("mdm-qr-code"), {
                    text: JSON.stringify(mdmPayload),
                    width: 150,
                    height: 150,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.L
                });
            }
        }, 500);
    </script>
    '''
    
    # Insert the QR code HTML after "全自動でパッチ適用されます。"
    content = content.replace('全自動でパッチ適用されます。<br>', f'全自動でパッチ適用されます。<br>\n{qr_html}')
    
    with codecs.open(filename, 'w', 'utf-8') as f:
        f.write(content)

update_html('retailer_portal.html')
update_html('store_portal.html')
