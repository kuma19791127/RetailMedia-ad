import sys
import os
import re

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

import pypdf

path = r"C:\Users\one\Desktop\API利用契約書(プライベート更新系).pdf"

if not os.path.exists(path):
    print(f"File not found: {path}")
    sys.exit(1)

print(f"Reading all pages of {path}")
reader = pypdf.PdfReader(path)
print(f"Total pages: {len(reader.pages)}")

# Print lines that contain numbers, dots, IPs or "アドレス", "接続"
ip_pattern = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")

for idx in range(len(reader.pages)):
    text = reader.pages[idx].extract_text()
    print(f"\n--- Page {idx+1} ---")
    for line in text.split('\n'):
        line_clean = line.strip()
        if not line_clean:
            continue
        # Print lines of interest
        if any(x in line_clean.lower() for x in ["ip", "アドレス", "接続", "届出", "届け出", "gmo"]) or ip_pattern.search(line_clean) or any(char.isdigit() for char in line_clean):
            print(f"  {line_clean}")
