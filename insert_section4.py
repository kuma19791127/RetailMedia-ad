# -*- coding: utf-8 -*-
import codecs
import re

new_section = '''
    <h4 style="margin-top:25px; color:#0f172a; border-left:4px solid #f59e0b; padding-left:10px; font-size: 1.1rem;">4. セキュリティパッチを利用しない場合（初期化できないサイネージパネル・社用端末など）</h4>
    <p style="font-size:0.95rem; color:#475569; line-height:1.6; margin-bottom:15px;">
        業務で既に使用しているサイネージパネルやスマートフォンなど、端末を初期化できない場合は、QRコードによる全自動セキュリティ設定（完全キオスクモード）はご利用いただけません。<br>
        その場合は、手動でアプリをインストールし、Android標準の機能である「画面のピン留め」機能をご利用ください。
    </p>

    <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:15px;">
        <strong style="color:#334155; display:block; margin-bottom:10px;">【手動インストールと固定化の手順】</strong>
        <ol style="margin:0; padding-left:20px; font-size:0.9rem; line-height:1.8; color:#334155;">
            <li>以下のボタンから、Android用アプリ（APKファイル）を端末に直接ダウンロードしてインストールしてください。<br>
                <a href="https://retail-media-db-2026.s3.us-east-1.amazonaws.com/app-debug.apk" download style="margin-top:10px; margin-bottom:10px; background:#f59e0b; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; display:inline-block; text-decoration:none;">📱 Android用アプリを手動ダウンロード</a>
            </li>
            <li>アプリのインストール後、Androidの「設定」アプリを開き、「セキュリティ」＞「詳細設定（またはその他のセキュリティ設定）」＞<strong>「画面のピン留め（App Pinning）」</strong> をオンにします。</li>
            <li>リテアドのサイネージアプリを起動した状態で、タスク一覧（起動中のアプリ一覧）を開き、アプリアイコンをタップして「ピン留め」を選択します。</li>
        </ol>
    </div>

    <div style="background:#fff7ed; padding:15px; border-radius:8px; border:1px solid #ffedd5;">
        <strong style="color:#9a3412; display:block; margin-bottom:10px;">【運用のメリットと注意点】</strong>
        <ul style="margin:0; padding-left:20px; font-size:0.9rem; line-height:1.8; color:#9a3412;">
            <li>ピン留めを行うと、特定の解除操作（戻るボタンとホームボタンの同時長押し等）を行わない限り、サイネージ画面からホーム画面に戻れなくなるため、店頭でのイタズラ防止に十分役立ちます。</li>
            <li>業務で使用する際は、店員様ご自身でピン留めを解除することで、普段通り他のアプリ（レジ等）をご利用いただけます。</li>
            <li><strong>※重要※</strong> 完全なキオスクモードではないため、USBポートの自動無効化は適用されません。USBポートにテープを貼ったり、配線部分をカバーで覆うなどの<strong>物理ブロック</strong>を行い、不用意に機器を接続されないようご注意ください。</li>
        </ul>
    </div>
'''

def insert_section(filename):
    with codecs.open(filename, 'r', 'utf-8') as f:
        content = f.read()
    
    target_pattern = r'(<li><strong>【セキュリティパッチの実装】</strong>ダウンロードしたファイルを実行するだけで、<strong>USBメモリの読み込み無効化、キオスクモード設定、全画面起動</strong>が全自動でパッチ適用されます。</li>\s*</ul>)'
    
    content = re.sub(target_pattern, r'\1' + '\n' + new_section, content)
    
    with codecs.open(filename, 'w', 'utf-8') as f:
        f.write(content)

insert_section('retailer_portal.html')
insert_section('store_portal.html')
