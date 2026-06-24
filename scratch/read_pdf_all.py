import sys
import os

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

import pypdf

pdf_paths = [
    r"C:\Users\one\Desktop\API接続情報通知書_non-logi様 Copy.pdf",
    r"C:\Users\one\Desktop\web\API接続情報通知書_non-logi様.pdf"
]

for path in pdf_paths:
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
    print(f"\n=========================================\nFull PDF text: {path}")
    try:
        reader = pypdf.PdfReader(path)
        print(f"Total pages: {len(reader.pages)}")
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            print(f"--- Page {idx+1} ---")
            print(text)
    except Exception as e:
        print(f"Error reading PDF {path}: {e}")
