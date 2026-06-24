import os
import re
import sys

# Reconfigure stdout to use UTF-8
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

search_dirs = [
    r"C:\Users\one\Desktop",
    r"C:\Users\one\Documents",
    r"C:\Users\one\Downloads",
    r"C:\Users\one\.gemini\antigravity\playground\twilight-parsec"
]

patterns = [
    re.compile(r"gmo", re.I),
    re.compile(r"api", re.I),
    re.compile(r"申込", re.I),
    re.compile(r"登録", re.I),
    re.compile(r"接続", re.I),
    re.compile(r"ip", re.I),
    re.compile(r"aozora", re.I),
    re.compile(r"あおぞら", re.I),
    re.compile(r"ganb", re.I)
]

print("Searching files...")
found_files = []
for sdir in search_dirs:
    if not os.path.exists(sdir):
        continue
    for root, dirs, files in os.walk(sdir):
        if "node_modules" in root or "temp_repo" in root or ".git" in root:
            continue
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in ['.pdf', '.xlsx', '.xlsm']:
                matched = False
                for pat in patterns:
                    if pat.search(file):
                        matched = True
                        break
                if matched:
                    fullpath = os.path.join(root, file)
                    found_files.append(fullpath)

print(f"Found {len(found_files)} files:")
for f in found_files:
    print(f)
