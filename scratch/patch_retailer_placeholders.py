# -*- coding: utf-8 -*-
import os

file_path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\retailer_portal.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. 宛先リストの例 (LIFE_001 -> 1000001)
target_1 = "（例: LIFE_001, 店舗mailアドレス）を"
replacement_1 = "（例: 1000001, 店舗mailアドレス）を"

# 2. 動画アップロードの配信ターゲットプレースホルダー (LIFE_001 -> 1000001)
target_2 = 'placeholder="例: LIFE_001"'
replacement_2 = 'placeholder="例: 1000001"'

# 3. JavaScript動的追加のプレースホルダー (LIFE_002 -> 1000002)
target_3 = 'placeholder="例: LIFE_002"'
replacement_3 = 'placeholder="例: 1000002"'

if target_1 in content and target_2 in content and target_3 in content:
    content = content.replace(target_1, replacement_1)
    content = content.replace(target_2, replacement_2)
    content = content.replace(target_3, replacement_3)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS: Placeholders updated successfully.")
else:
    print("ERROR: One or more targets not found in retailer_portal.html")
