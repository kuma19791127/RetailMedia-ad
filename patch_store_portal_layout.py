import codecs
import re

with codecs.open('store_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# 1. 既存の「推奨スペック」を削除
spec_target = """<div style="background:#e0f2fe; padding:12px; border-radius:6px; border:1px solid #bae6fd; margin-bottom:15px; font-size:0.85rem; color:#0c4a6e; line-height:1.6;">
        <strong style="color:#0369a1;">🖥️ リテアドを稼働させる推奨スペック</strong><br>
        ・メモリ(RAM): <span style="font-weight:bold; color:#e74c3c;">推奨 3GB 以上</span><br>
        ・ストレージ: <span style="font-weight:bold; color:#e74c3c;">空き容量 2GB 以上</span><br>
        <span style="font-size:0.75rem; color:#0284c7;">※長時間の安定した動画再生のため、上記スペック以上の端末を推奨いたします。</span>
    </div>"""
if spec_target in text:
    text = text.replace(spec_target, "")

# 2. <h3>の直後に新しい説明文と推奨スペックを挿入する
h3_target = '<h3 style="margin-top:0; color:#047857;">📱 サイネージ自動起動セットアップ（Android専用アプリ）</h3>'
h3_replace = """<h3 style="margin-top:0; color:#047857;">📱 サイネージ自動起動セットアップ（Android専用アプリ）</h3>

    <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:20px; line-height:1.7;">
        <p style="margin-top:0; color:#334155;">
            Android搭載のサイネージパネルに<br class="mobile-br">
            専用アプリをインストールするだけで<br class="mobile-br">
            自動的にサイネージと登録され<br class="mobile-br">
            広告配信事業が開始されます。
        </p>
        <div style="background:#fffbeb; border-left:4px solid #f59e0b; padding:12px; margin-bottom:15px; border-radius:4px;">
            <strong style="color:#d97706;">💡 停電時の自動復旧について</strong><br>
            <span style="font-size:0.9rem; color:#451a03;">
                Androidアプリ「RetailMedia Signage」は<br class="mobile-br">
                端末起動時に自動で立ち上がる<br class="mobile-br">
                設定が可能です。<br>
                そのため停電などで電源が落ちた場合でも<br class="mobile-br">
                電気が復旧して端末が再起動されれば<br class="mobile-br">
                自動的にサイネージ配信が<br class="mobile-br">
                自動再開されます。
            </span>
        </div>
        <div style="background:#e0f2fe; padding:12px; border-radius:6px; border:1px solid #bae6fd; font-size:0.85rem; color:#0c4a6e;">
            <strong style="color:#0369a1;">🖥️ リテアドを稼働させる共通推奨スペック</strong><br>
            ・メモリ(RAM): <span style="font-weight:bold; color:#e74c3c;">推奨 3GB 以上</span><br>
            ・ストレージ: <span style="font-weight:bold; color:#e74c3c;">空き容量 2GB 以上</span><br>
            <span style="font-size:0.75rem; color:#0284c7;">※長時間の安定した動画再生のため、上記スペック以上の端末を推奨いたします。</span>
        </div>
    </div>"""

if h3_target in text:
    text = text.replace(h3_target, h3_replace)

# 3. 2番の被っている箇所を整理するか、ユーザーの指示に合わせて調整
# "アプリのダウンロードリンクを送信する と1.2.3.4.は同じで特に2と内容が被ると思います"
# If they overlap, we can remove the redundnat parts of "2." or keep them as standard setup steps.
# Actually, I will just update the store_portal.html as requested above for now.

with codecs.open('store_portal.html', 'w', 'utf-8') as f:
    f.write(text)

print("Patched store_portal.html layout")
