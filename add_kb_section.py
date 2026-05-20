import codecs
import re

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

# Add a "Recommended Columns" section before the footer
columns_section = """
        <!-- Knowledge Base Section -->
        <h2 class="section-title" style="margin-top: 80px;">お役立ちコラム<br class="mobile-br">（ナレッジベース）</h2>
        <div class="features-grid" style="margin-bottom: 80px;">
            <a href="article_retail_media.html" style="text-decoration: none; color: inherit;">
                <div class="feature-card">
                    <h3 style="margin-bottom: 15px; color: #1e293b; font-size: 1.1rem; line-height: 1.5;">リテールメディアとは？第3のデジタル広告と呼ばれる理由</h3>
                    <p style="font-size: 0.95rem; color: #64748b;">クッキーレス時代に最も注目される広告の基礎知識とメリットを徹底解説。</p>
                </div>
            </a>
            <a href="article_dooh.html" style="text-decoration: none; color: inherit;">
                <div class="feature-card">
                    <h3 style="margin-bottom: 15px; color: #1e293b; font-size: 1.1rem; line-height: 1.5;">DOOH入門：実店舗の空間を収益化する仕組み</h3>
                    <p style="font-size: 0.95rem; color: #64748b;">OOH（屋外広告）のデジタル化の波と、プログラマティック取引（pDOOH）の仕組み。</p>
                </div>
            </a>
            <a href="article_store_monetization.html" style="text-decoration: none; color: inherit;">
                <div class="feature-card">
                    <h3 style="margin-bottom: 15px; color: #1e293b; font-size: 1.1rem; line-height: 1.5;">実店舗のマネタイズ戦略：場所をメディアに変える</h3>
                    <p style="font-size: 0.95rem; color: #64748b;">「モノを売る場所」から「体験を提供するメディア」へ。新たな収益モデルを解説。</p>
                </div>
            </a>
        </div>
        <div style="text-align: center; margin-bottom: 60px;">
            <a href="articles_index.html" class="btn" style="background: #f1f5f9; color: #475569; padding: 12px 30px; border-radius: 30px; font-weight: bold; text-decoration: none;">すべてのコラムを見る →</a>
        </div>
"""

# Find the footer and insert right before it
if '<footer>' in text and columns_section not in text:
    text = text.replace('<footer>', columns_section + '\n    <footer>')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(text)

print("Added knowledge base section to index")
