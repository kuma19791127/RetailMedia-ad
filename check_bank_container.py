import codecs
import re

with codecs.open('creator_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# Find the form or container having "口座番号"
match = re.search(r'<div[^>]*>[\s\S]{0,1000}口座番号[\s\S]{0,1000}</div>', text)
if match:
    print(match.group(0)[:2000])
