# -*- coding: utf-8 -*-
import codecs
import re

def process_file(filename):
    with codecs.open(filename, 'r', 'utf-8') as f:
        content = f.read()

    # Make sure we have utf-8 meta tag in head
    if '<meta charset="utf-8">' not in content and '<meta charset="UTF-8">' not in content:
        content = content.replace('<head>', '<head>\n    <meta charset="UTF-8">')

    # CSS for mobile breaks
    mobile_break_css = '''<style>
@media (min-width: 600px) {
    .mbr { display: none; }
}
@media (max-width: 599px) {
    .mbr { display: block; }
}
</style>'''
    if '.mbr { display: none; }' not in content:
        content = content.replace('</head>', mobile_break_css + '\n</head>')

    # Regex replacements for text
    replacements = [
        (r'自社提供の専用ハードウェア（透明LEDフィルムとAndroidコントローラーセット）は、納品前にMDMやUSB無効化、キオスクモード設定などをすべて済ませた「完全な専用機」として納品されます。',
         '自社提供の専用ハードウェア<br class="mbr">（透明LEDフィルムと<br class="mbr">Androidコントローラー）は、<br class="mbr">納品前にMDMやUSB無効化、<br class="mbr">キオスクモード設定などを<br class="mbr">すべて済ませた「完全な専用機」<br class="mbr">として納品されます。'),
         
        (r'店舗側でのセキュリティ知識や設定作業は一切不要です。電源を挿し、Wi-Fi等のインターネットに接続するだけで安全に稼働します。',
         '店舗側でのセキュリティ知識や<br class="mbr">設定作業は一切不要です。<br class="mbr">電源を挿し、Wi-Fi等の<br class="mbr">インターネットに接続するだけで<br class="mbr">安全に稼働します。'),
         
        (r'既存のAndroidパネル（BYOD）をお持ちの場合は、専用アプリをインストールするだけで始められます。',
         '既存のAndroidパネル（BYOD）を<br class="mbr">お持ちの場合は、専用アプリを<br class="mbr">インストールするだけで<br class="mbr">始められます。'),
         
        (r'専用のダウンロードリンクから「RetailMedia Signage」アプリ（APK）をインストールします。',
         '専用のダウンロードリンクから<br class="mbr">「RetailMedia Signage」アプリ<br class="mbr">（APK）をインストールします。'),
         
        (r'初期設定画面にて、配布された専用のQRコードを読み込ませることで、デバイスオーナー権限が付与され、<strong>USBポートの無効化と完全キオスクモード化（画面固定）が全自動でパッチ適用</strong>されます。',
         '初期設定画面にて、配布された<br class="mbr">専用のQRコードを読み込ませる<br class="mbr">ことで、デバイスオーナー権限が<br class="mbr">付与され、<strong>USBポートの無効化と<br class="mbr">完全キオスクモード化（画面固定）が<br class="mbr">全自動でパッチ適用</strong>されます。'),
         
        (r'Windowsパソコンをサイネージとして利用する場合も、専用ファイルで全自動セットアップが可能です。',
         'Windowsパソコンをサイネージ<br class="mbr">として利用する場合も、専用ファイル<br class="mbr">で全自動セットアップが可能です。'),
         
        (r'以下のボタンから「Windows専用セキュリティパッチ兼セットアップファイル\(.bat\)」をダウンロードします。',
         '以下のボタンから「Windows専用<br class="mbr">セキュリティパッチ兼<br class="mbr">セットアップファイル(.bat)」<br class="mbr">をダウンロードします。'),
         
        (r'ダウンロードしたファイルを実行するだけで、<strong>USBメモリの読み込み無効化、キオスクモード設定、全画面起動</strong>が全自動でパッチ適用されます。',
         'ダウンロードしたファイルを実行<br class="mbr">するだけで、<strong>USBメモリの<br class="mbr">読み込み無効化、キオスク<br class="mbr">モード設定、全画面起動</strong>が<br class="mbr">全自動でパッチ適用されます。'),
         
        (r'業務で既に使用しているサイネージパネルやスマートフォンなど、端末を初期化できない場合は、QRコードによる全自動セキュリティ設定（完全キオスクモード）はご利用いただけません。',
         '業務で既に使用している<br class="mbr">サイネージパネルや<br class="mbr">スマートフォンなど、端末を<br class="mbr">初期化できない場合は、QRコード<br class="mbr">による全自動セキュリティ設定<br class="mbr">（完全キオスクモード）は<br class="mbr">ご利用いただけません。'),
         
        (r'その場合は、手動でアプリをインストールし、Android標準の機能である「画面のピン留め」機能をご利用ください。',
         'その場合は、手動でアプリを<br class="mbr">インストールし、Android標準の<br class="mbr">機能である「画面のピン留め」<br class="mbr">機能をご利用ください。'),
         
        (r'以下のボタンから、Android用アプリ（APKファイル）を端末に直接ダウンロードしてインストールしてください。',
         '以下のボタンから、Android用アプリ<br class="mbr">（APKファイル）を端末に<br class="mbr">直接ダウンロードして<br class="mbr">インストールしてください。'),
         
        (r'アプリのインストール後、Androidの「設定」アプリを開き、「セキュリティ」＞「詳細設定（またはその他のセキュリティ設定）」＞<strong>「画面のピン留め（App Pinning）」</strong> をオンにします。',
         'アプリのインストール後、<br class="mbr">Androidの「設定」アプリを開き、<br class="mbr">「セキュリティ」＞<br class="mbr">「詳細設定（またはその他の<br class="mbr">セキュリティ設定）」＞<br class="mbr"><strong>「画面のピン留め」</strong> をオンにします。'),
         
        (r'リテアドのサイネージアプリを起動した状態で、タスク一覧（起動中のアプリ一覧）を開き、アプリアイコンをタップして「ピン留め」を選択します。',
         'リテアドのサイネージアプリを<br class="mbr">起動した状態で、タスク一覧<br class="mbr">（起動中のアプリ一覧）を開き、<br class="mbr">アプリアイコンをタップして<br class="mbr">「ピン留め」を選択します。'),
         
        (r'ピン留めを行うと、特定の解除操作（戻るボタンとホームボタンの同時長押し等）を行わない限り、サイネージ画面からホーム画面に戻れなくなるため、店頭でのイタズラ防止に十分役立ちます。',
         'ピン留めを行うと、特定の<br class="mbr">解除操作（戻るボタンとホーム<br class="mbr">ボタンの同時長押し等）を<br class="mbr">行わない限り、サイネージ画面から<br class="mbr">ホーム画面に戻れなくなるため、<br class="mbr">店頭でのイタズラ防止に<br class="mbr">十分役立ちます。'),
         
        (r'業務で使用する際は、店員様ご自身でピン留めを解除することで、普段通り他のアプリ（レジ等）をご利用いただけます。',
         '業務で使用する際は、店員様<br class="mbr">ご自身でピン留めを解除<br class="mbr">することで、普段通り他の<br class="mbr">アプリ（レジ等）をご利用<br class="mbr">いただけます。'),
         
        (r'完全なキオスクモードではないため、USBポートの自動無効化は適用されません。USBポートにテープを貼ったり、配線部分をカバーで覆うなどの<strong>物理ブロック</strong>を行い、不用意に機器を接続されないようご注意ください。',
         '完全なキオスクモードではないため、<br class="mbr">USBポートの自動無効化は<br class="mbr">適用されません。USBポートに<br class="mbr">テープを貼ったり、配線部分を<br class="mbr">カバーで覆うなどの<strong>物理ブロック</strong>を<br class="mbr">行い、不用意に機器を<br class="mbr">接続されないようご注意ください。')
    ]

    for old, new in replacements:
        content = re.sub(old, new, content)

    with codecs.open(filename, 'w', 'utf-8') as f:
        f.write(content)

process_file('retailer_portal.html')
process_file('store_portal.html')
