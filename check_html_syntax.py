import codecs
import re
import os
import subprocess

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

for file in html_files:
    try:
        with codecs.open(file, 'r', 'utf-8') as f:
            text = f.read()
        
        scripts = re.findall(r'<script[^>]*>(.*?)<\/script>', text, re.IGNORECASE | re.DOTALL)
        for i, script in enumerate(scripts):
            if script.strip() == '': continue
            
            temp_name = f"temp_check_{file}_{i}.js"
            with codecs.open(temp_name, 'w', 'utf-8') as tf:
                # Add dummy variables for browser globals to avoid some parsing edge cases, though node -c doesn't execute
                tf.write(script)
            
            # Run node -c
            result = subprocess.run(['node', '-c', temp_name], capture_output=True, text=True)
            if result.returncode != 0:
                print(f"Error in {file} script {i}:")
                print(result.stderr)
            
            os.remove(temp_name)
    except Exception as e:
        print(f"Failed to process {file}: {e}")
