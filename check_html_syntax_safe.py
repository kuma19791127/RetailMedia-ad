import codecs
import re
import os
import subprocess

html_files = [f for f in os.listdir('.') if f.endswith('.html')]
errors_found = False

for file in html_files:
    try:
        with codecs.open(file, 'r', 'utf-8') as f:
            text = f.read()
        
        scripts = re.findall(r'<script[^>]*>(.*?)<\/script>', text, re.IGNORECASE | re.DOTALL)
        for i, script in enumerate(scripts):
            if script.strip() == '': continue
            
            temp_name = f"temp_check_{file}_{i}.js"
            with codecs.open(temp_name, 'w', 'utf-8') as tf:
                tf.write(script)
            
            # Run node -c with utf-8 encoding
            result = subprocess.run(['node', '-c', temp_name], capture_output=True, encoding='utf-8', errors='replace')
            if result.returncode != 0:
                errors_found = True
                print(f"--- Syntax Error in {file} (Script {i}) ---")
                print(result.stderr)
            
            if os.path.exists(temp_name):
                os.remove(temp_name)
    except Exception as e:
        pass

if not errors_found:
    print("ALL CLEAR! No syntax errors in any HTML scripts.")
