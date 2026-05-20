import codecs
import re

with codecs.open('creator_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# I need to find the fetch that hits `/api/creator/upload`
# The problem is I don't know the exact line. Let's search for it.
match = re.search(r"fetch\(['\"`].*?/api/creator/upload", text)
if match:
    print("Found upload endpoint in creator_portal")
else:
    print("Did not find upload endpoint in creator_portal")
