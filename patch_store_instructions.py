import re

fp = 'c:/Users/one/Desktop/RetailMedia_System/store_portal.html'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the specific instructions block in store_portal.html
# "黒い画面が出たら、画面の形（1～5）を入力してEnter" -> "ダブルクリックするだけで設定完了です！"

# Just replace the whole list item 3
old_text1 = "黒い画面が出たら、画面の形（1～5）を入力してEnterを押します。"
new_text1 = "ダブルクリックすると黒い画面が一瞬開き、自動的に設定が完了します。（すぐにテスト再生が始まります）"
content = content.replace(old_text1, new_text1)

old_text2 = "設定完了後、次回からはパソコンの電源を入れるだけで自動再生されます。"
new_text2 = "✅ 設定はこれだけです！次回からはパソコンの電源を入れるだけで、一切の操作なしに全自動で動画配信が開始されます。"
content = content.replace(old_text2, new_text2)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated store_portal instructions")
