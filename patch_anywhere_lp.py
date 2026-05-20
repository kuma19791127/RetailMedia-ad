import codecs
import re

with codecs.open('anywhere_lp.html', 'r', 'utf-8') as f:
    text = f.read()

# Pattern 1 replacement
# Original text has "翌月支払い。" or something similar.
# The user wants:
# 初期導入費用0円。お客様ご自身の
# スマートフォンや
# 店員のモバイル端末で、
# いつでもどこでもバーコードスキャンと
# 決済（Square決済）が完了。
# 1.2週間で売り上げのお振込み
# POSデータと連携し、
# すぐに利用開始できます。

replace1 = """初期導入費用0円。お客様ご自身の<br class="mobile-br">
                        スマートフォンや<br class="mobile-br">
                        店員のモバイル端末で、<br class="mobile-br">
                        いつでもどこでもバーコードスキャンと<br class="mobile-br">
                        決済（Square決済）が完了。<br class="mobile-br">
                        <span style="color:#d97706; font-weight:bold;">1.2週間で売り上げのお振込み</span><br class="mobile-br">
                        POSデータと連携し、<br class="mobile-br">
                        すぐに利用開始できます。"""

# Try to find the block to replace. It usually starts with "初期導入費用0円。"
idx = text.find('初期導入費用0円。')
if idx != -1:
    end_idx = text.find('すぐに利用開始できます。', idx) + len('すぐに利用開始できます。')
    if end_idx > idx:
        old_block = text[idx:end_idx]
        text = text.replace(old_block, replace1)

# Pattern 2 replacement
# Original: 売り上げ分の1.2%を翌月徴収させていただくのみ 完全な成果報酬型モデル
# Target: 売り上げ分の1.2%を引いた金額を1.2週間でお振込み 完全な成果報酬型モデル
idx2 = text.find('売り上げ分の1.2%を')
if idx2 != -1:
    # Just a simple string replace for the specific lines
    text = text.replace('売り上げ分の1.2%を<br class="mobile-br">\n                        翌月徴収させていただくのみ', '売り上げ分の1.2%を引いた<br class="mobile-br">\n                        金額を1.2週間でお振込み')
    text = text.replace('売り上げ分の1.2%を<br>\n                        翌月徴収させていただくのみ', '売り上げ分の1.2%を引いた<br>\n                        金額を1.2週間でお振込み')
    text = text.replace('売り上げ分の1.2%を\n翌月徴収させていただくのみ', '売り上げ分の1.2%を引いた\n金額を1.2週間でお振込み')
    # Or regex replace
    text = re.sub(r'売り上げ分の1.2%を(.*?)翌月徴収させていただくのみ', r'売り上げ分の1.2%を引いた\1金額を1.2週間でお振込み', text, flags=re.DOTALL)


with codecs.open('anywhere_lp.html', 'w', 'utf-8') as f:
    f.write(text)

print("Patched anywhere_lp.html")
