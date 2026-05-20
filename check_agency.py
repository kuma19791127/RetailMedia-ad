import codecs
import re

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

# Let's search for arrays or objects named *agency* or *Agency*
declarations = re.findall(r'(let|const)\s+([a-zA-Z0-9_]*agency[a-zA-Z0-9_]*)\s*=', text, re.IGNORECASE)
for d in declarations:
    print(d[0], d[1])

# Also check for endpoints related to agency bank
endpoints = re.findall(r'app\.(post|get)\([\'"]([^\'"]*agency[^\'"]*)[\'"]', text, re.IGNORECASE)
for ep in endpoints:
    print(ep[0], ep[1])
