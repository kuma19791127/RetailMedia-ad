import codecs
import re

with codecs.open('creator_portal.html', 'r', 'utf-8') as f:
    text = f.read()

match = re.search(r'id=[\'"]bankModal[\'"][\s\S]*?</form>', text)
if match:
    print(match.group(0))
else:
    print('bankModal not found')
