import codecs
import re
import subprocess
import os

with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# Find script blocks
matches = re.finditer(r'<script.*?>([\s\S]*?)</script>', text)
for i, match in enumerate(matches):
    script_content = match.group(1)
    if script_content.strip():
        # Write to temp file
        with codecs.open(f'temp_script_{i}.js', 'w', 'utf-8') as sf:
            sf.write(script_content)
        
        # Check syntax using node
        result = subprocess.run(['node', '-c', f'temp_script_{i}.js'], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error in script block {i}:")
            print(result.stderr)
        
        # Cleanup
        os.remove(f'temp_script_{i}.js')
