import sys
import os
import re

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

import pypdf

path = r"C:\Users\one\Downloads\弊社概要・申込書・資金繰り表.pdf"

if not os.path.exists(path):
    print(f"File not found: {path}")
    sys.exit(1)

print(f"Reading all pages of {path}")
reader = pypdf.PdfReader(path)
print(f"Total pages: {len(reader.pages)}")

# Print lines that contain GMO, API, IP, etc.
ip_pattern = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")

for idx in range(len(reader.pages)):
    text = reader.pages[idx].extract_text()
    for line in text.split('\n'):
        line_clean = line.strip()
        if not line_clean:
            continue
        if any(x in line_clean.lower() for x in ["gmo", "api", "ip", "アドレス", "接続"]):
            print(f"Page {idx+1}: {line_clean}")
        elif ip_pattern.search(line_clean):
            print(f"Page {idx+1} (IP): {line_clean}")
