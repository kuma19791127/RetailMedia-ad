import codecs
import re

with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

headers = re.findall(r'<h[1-4].*?>(.*?)</h[1-4]>', text)
buttons = re.findall(r'<button.*?>(.*?)</button>', text)
with codecs.open('admin_features.txt', 'w', 'utf-8') as out:
    out.write("HEADERS:\n")
    for h in headers:
        out.write(h + "\n")
    out.write("\nBUTTONS:\n")
    for b in set(buttons):
        out.write(b + "\n")
