import sys
import os
import re

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

# Try importing pypdf
try:
    import pypdf
    print("pypdf available")
except ImportError:
    try:
        import PyPDF2 as pypdf
        print("PyPDF2 available")
    except ImportError:
        pypdf = None
        print("No PDF library available. Trying to install pypdf...")

pdf_paths = [
    r"C:\Users\one\Desktop\API接続情報通知書_non-logi様 Copy.pdf",
    r"C:\Users\one\Desktop\web\API接続情報通知書_non-logi様.pdf",
    r"C:\Users\one\Downloads\GMOあおぞらネット銀行.pdf"
]

ip_pattern = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")

if pypdf is None:
    # Try installing pypdf via subprocess
    import subprocess
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
        import pypdf
        print("pypdf installed successfully")
    except Exception as e:
        print(f"Failed to install pypdf: {e}")

if pypdf:
    for path in pdf_paths:
        if not os.path.exists(path):
            print(f"File not found: {path}")
            continue
        print(f"\n=========================================\nReading PDF: {path}")
        try:
            reader = pypdf.PdfReader(path)
            for idx, page in enumerate(reader.pages):
                text = page.extract_text()
                print(f"--- Page {idx+1} ---")
                for line in text.split('\n'):
                    if any(x in line.lower() for x in ["ip", "アドレス", "接続", "届出", "届け出", "gmo"]) or ip_pattern.search(line):
                        print(line)
        except Exception as e:
            print(f"Error reading PDF {path}: {e}")
else:
    print("Cannot read PDFs without a library.")
