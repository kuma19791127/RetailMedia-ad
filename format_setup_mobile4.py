import codecs

files = ['retailer_portal.html', 'store_portal.html']

for f_path in files:
    with codecs.open(f_path, 'r', 'utf-8') as f:
        text = f.read()

    # 1. Heading 2
    old_h2 = '2. Androidアプリと<br class="mobile-br">サイネージパネルのセットアップと<br class="mobile-br">セキュリティパッチ'
    new_h2 = '2. Androidアプリと<br class="mobile-br">サイネージパネルの<br class="mobile-br">セットアップと<br class="mobile-br">セキュリティパッチ'
    text = text.replace(old_h2, new_h2)

    # 2. QR code title
    old_qr_title = '📱 Androidセットアップ用 プロビジョニングQRコード'
    new_qr_title = '📱 Androidセットアップ用<br class="mobile-br">プロビジョニングQRコード'
    text = text.replace(old_qr_title, new_qr_title)

    # 3. QR code note
    old_qr_note = '※初期化されたAndroid端末の「こんにちは」画面を6回連続タップし、このQRコードを読み込ませてください。'
    new_qr_note = '※初期化されたAndroid端末の<br class="mobile-br">「こんにちは」画面を<br class="mobile-br">6回連続タップし<br class="mobile-br">このQRコードを読み込ませてください。'
    
    # Just in case it was already modified or slightly different
    if old_qr_note in text:
        # The user wrote "このQRコードをタップ", I'll use exactly that if requested, 
        # but the request said "このQRコードをタップ" so I'll put it.
        new_qr_note = '※初期化されたAndroid端末の<br class="mobile-br">「こんにちは」画面を<br class="mobile-br">6回連続タップし<br class="mobile-br">このQRコードをタップ'
        text = text.replace(old_qr_note, new_qr_note)
    elif '※初期化されたAndroid端末の' in text and '「こんにちは」' in text:
        # Try to find and replace
        import re
        text = re.sub(
            r'※初期化されたAndroid端末の.*?このQRコードを[^\<]*',
            '※初期化されたAndroid端末の<br class="mobile-br">「こんにちは」画面を<br class="mobile-br">6回連続タップし<br class="mobile-br">このQRコードをタップ',
            text, flags=re.DOTALL
        )

    # 4. Manual install note
    old_manual_note = '※手動インストールの場合は<br class="mobile-br">アプリ初回起動時に表示される<br class="mobile-br">「画面のピン留め」を許可してください。<br class="mobile-br">これにより不正操作をブロックします。'
    new_manual_note = '※手動インストールの場合は<br class="mobile-br">アプリ初回起動時に表示される<br class="mobile-br">「画面のピン留め」を<br class="mobile-br">許可してください。<br class="mobile-br">これにより不正操作をブロックします。'
    text = text.replace(old_manual_note, new_manual_note)

    with codecs.open(f_path, 'w', 'utf-8') as f:
        f.write(text)
    
    print(f"Updated {f_path}")
