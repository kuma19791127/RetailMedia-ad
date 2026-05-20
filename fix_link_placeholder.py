with open('retailer_portal.html', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = '''                    Swal.fire('送信完了', result.value + ' 宛にアプリのダウンロードリンクを送信しました。', 'success');'''
replacement1 = '''                    Swal.fire('送信完了', result.value + ' 宛に以下のダウンロードリンクを送信しました。<br><br><a href="https://retail-ad.com/download/RetailMediaSignage.apk" target="_blank" style="word-break:break-all;">https://retail-ad.com/download/RetailMediaSignage.apk</a>', 'success');'''
text = text.replace(target1, replacement1)

target2 = '''const text = `【サイネージ初期設定のお願い】\\n\\n店舗のサイネージパネル（Android端末）にて、以下の設定をお願いします。\\n※必ずWi-Fi等のインターネットに接続してください。USBやSDカードのみでのオフライン運用はできません。\\n\\n1. 配布された専用リンクから「RetailMedia Signage」アプリ（APKファイル）をインストールしてください。\\n2. アプリを起動するだけで初期設定は完了です。\\n（※自動で店舗と紐付くため、IDの入力等は不要です）\\n\\n※数秒で自動的に広告・CMの放映がスタートします。電源を入れるだけで次回からは自動再生され、停電時も自動復旧します。`;'''
replacement2 = '''const text = `【サイネージ初期設定のお願い】\\n\\n店舗のサイネージパネル（Android端末）にて、以下の設定をお願いします。\\n※必ずWi-Fi等のインターネットに接続してください。USBやSDカードのみでのオフライン運用はできません。\\n\\n1. 以下の専用リンクから「RetailMedia Signage」アプリ（APKファイル）をインストールしてください。\\n▼ ダウンロードURL\\nhttps://retail-ad.com/download/RetailMediaSignage.apk\\n\\n2. アプリを起動するだけで初期設定は完了です。\\n（※自動で店舗と紐付くため、IDの入力等は不要です）\\n\\n※数秒で自動的に広告・CMの放映がスタートします。電源を入れるだけで次回からは自動再生され、停電時も自動復旧します。`;'''
text = text.replace(target2, replacement2)

with open('retailer_portal.html', 'w', encoding='utf-8') as f:
    f.write(text)

with open('store_portal.html', 'r', encoding='utf-8') as f:
    text2 = f.read()

text2 = text2.replace(target1, replacement1)

with open('store_portal.html', 'w', encoding='utf-8') as f:
    f.write(text2)
