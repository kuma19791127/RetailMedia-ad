import codecs
import re

with codecs.open('agency_portal.html', 'r', 'utf-8') as f:
    text = f.read()

matches = re.findall(r'fetch\([\'"]([^\'"]+)[\'"]', text)
print("Fetches in agency_portal.html:")
for m in set(matches):
    print(m)
