import codecs
import re

with codecs.open('creator_portal.html', 'r', 'utf-8') as f:
    text = f.read()

target = "fetch('/api/creator/review-content'"
# Oh wait, earlier I checked and found fetch(`${API_BASE}/api/creator/stats`)
# Did I overwrite the whole fetch('/api/creator/review-content') block?
print(repr(re.findall(r'fetch\(.*?\)', text)))
