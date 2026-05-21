import codecs

with codecs.open('store_portal.html', 'r', 'utf-8') as f:
    content = f.read()

# Inject API_BASE_URL config
api_config = """
<!-- === API Base URL Config === -->
<script>
window.API_BASE_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:')
    ? 'http://localhost:3000'
    : 'https://nsg3hyme2k.us-east-1.awsapprunner.com';
</script>
"""

if "window.API_BASE_URL" not in content:
    idx = content.find('<head>')
    if idx != -1:
        content = content[:idx+6] + '\n' + api_config + content[idx+6:]

# Also replace raw fetch('/api/... with fetch(window.API_BASE_URL + '/api/...
import re
content = re.sub(r"fetch\(['\"]/api/", "fetch(window.API_BASE_URL + '/api/", content)
content = re.sub(r"fetch\(`/api/", "fetch(window.API_BASE_URL + `/api/", content)

with codecs.open('store_portal.html', 'w', 'utf-8') as f:
    f.write(content)
print("store_portal.html fixed!")
