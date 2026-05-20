import codecs
import re
import subprocess
import os

with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# Find script blocks
matches = list(re.finditer(r'<script.*?>([\s\S]*?)</script>', text))
script_content = matches[8].group(1)

with codecs.open('temp_script_8.js', 'w', 'utf-8') as sf:
    sf.write(script_content)

result = subprocess.run(['node', '-c', 'temp_script_8.js'], capture_output=True)
with codecs.open('error_output.txt', 'w', 'utf-8') as out:
    out.write(result.stderr.decode('utf-8', 'ignore'))
