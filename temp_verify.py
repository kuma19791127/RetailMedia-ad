import sys
import io
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

fp = 'c:/Users/one/Desktop/RetailMedia_System/retailer_portal.html'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract script tags
script_blocks = re.findall(r'<script.*?>\s*(.*?)\s*</script>', content, flags=re.DOTALL | re.IGNORECASE)

with open('temp_script.js', 'w', encoding='utf-8') as f:
    for block in script_blocks:
        f.write(block)
        f.write('\n')

