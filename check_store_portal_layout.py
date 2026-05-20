import codecs
import re

with codecs.open('store_portal.html', 'r', 'utf-8') as f:
    text = f.read()

with codecs.open('output_store.txt', 'w', 'utf-8') as out:
    matches = re.finditer(r'<h[234][^>]*>(.*?)</h[234]>', text)
    for m in matches:
        out.write(m.group(0) + '\n')

    idx = text.find('推奨スペック')
    if idx != -1:
        out.write('\n--- Snippet around 推奨スペック ---\n')
        out.write(text[max(0, idx-400):idx+800])
