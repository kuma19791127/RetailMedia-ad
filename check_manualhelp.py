import codecs
import re

with codecs.open('manualhelp.html', 'r', 'utf-8') as f:
    text = f.read()

match = re.search(r'PDFをアップロード.*?一覧に戻る', text, re.IGNORECASE | re.DOTALL)
if match:
    with codecs.open('manualhelp_upload.txt', 'w', 'utf-8') as f:
        f.write(match.group(0))
