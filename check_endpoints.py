import codecs
import re

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

for match in re.finditer(r"app\.post\('/api/([^']+)',", text):
    ep = match.group(1)
    if 'bank' in ep or 'kyc' in ep:
        print('/api/' + ep)
