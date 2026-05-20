import codecs
import re

files = ['retailer_portal.html', 'store_portal.html']

spec_html = """    <p style="font-size:0.9rem; color:#334155; line-height:1.6;">
        既存のAndroidコントローラーと<br class="mobile-br">サイネージパネルをお持ちの場合は<br class="mobile-br">専用アプリをインストールするだけで<br class="mobile-br">始められます。
    </p>

    <div style="background:#e0f2fe; padding:12px; border-radius:6px; border:1px solid #bae6fd; margin-bottom:15px; font-size:0.85rem; color:#0c4a6e; line-height:1.6;">
        <strong style="color:#0369a1;">🖥️ リテアドを稼働させる推奨スペック</strong><br>
        ・メモリ(RAM): <span style="font-weight:bold; color:#e74c3c;">推奨 3GB 以上</span><br>
        ・ストレージ: <span style="font-weight:bold; color:#e74c3c;">空き容量 2GB 以上</span><br>
        <span style="font-size:0.75rem; color:#0284c7;">※長時間の安定した動画再生のため、上記スペック以上の端末を推奨いたします。</span>
    </div>"""

for f_path in files:
    with codecs.open(f_path, 'r', 'utf-8') as f:
        text = f.read()

    # Find target
    target = """    <p style="font-size:0.9rem; color:#334155; line-height:1.6;">
        既存のAndroidコントローラーと<br class="mobile-br">サイネージパネルをお持ちの場合は<br class="mobile-br">専用アプリをインストールするだけで<br class="mobile-br">始められます。
    </p>"""

    if target in text:
        text = text.replace(target, spec_html)
        with codecs.open(f_path, 'w', 'utf-8') as f:
            f.write(text)
        print(f"Updated {f_path}")
    else:
        # Fallback regex search
        text = re.sub(
            r'<p style="font-size:0.9rem; color:#334155; line-height:1.6;">\s*既存のAndroidコントローラーと<br class="mobile-br">サイネージパネルをお持ちの場合は<br class="mobile-br">専用アプリをインストールするだけで<br class="mobile-br">始められます。\s*</p>',
            spec_html,
            text,
            flags=re.DOTALL
        )
        with codecs.open(f_path, 'w', 'utf-8') as f:
            f.write(text)
        print(f"Regex Updated {f_path}")
