# -*- coding: utf-8 -*-
import os

file_path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\store_portal.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. MCM収益表示の端末ID例 (ID:A-001 -> ID:2000001)
target_1 = "• レジ横パネル (ID:A-001):"
replacement_1 = "• レジ横パネル (ID:2000001):"

# 2. MCM収益表示の端末ID例 (ID:A-002 -> ID:2000002)
target_2 = "• 入口前パネル (ID:A-002):"
replacement_2 = "• 入口前パネル (ID:2000002):"

# 3. Google Ad Manager連携中ローディング表示 (A-001, A-002 -> 2000001, 2000002)
target_3 = "(端末ID: A-001, A-002, ...を登録中)"
replacement_3 = "(端末ID: 2000001, 2000002, ...を登録中)"

if target_1 in content and target_2 in content and target_3 in content:
    content = content.replace(target_1, replacement_1)
    content = content.replace(target_2, replacement_2)
    content = content.replace(target_3, replacement_3)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS: Placeholders updated successfully in store_portal.html")
else:
    print("ERROR: One or more targets not found in store_portal.html")
