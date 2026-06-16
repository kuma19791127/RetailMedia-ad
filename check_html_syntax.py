import codecs
import re
import os
import subprocess

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

for file in html_files:
    try:
        with codecs.open(file, 'r', 'utf-8') as f:
            text = f.read()
        
        # Find all script tags including their openings
        scripts = re.findall(r'(<script[^>]*>)(.*?)(<\/script>)', text, re.IGNORECASE | re.DOTALL)
        for i, (open_tag, script, close_tag) in enumerate(scripts):
            if script.strip() == '': continue
            
            # Skip if type is json or importmap etc.
            if 'type=' in open_tag.lower() and not any(js_type in open_tag.lower() for js_type in ['text/javascript', 'application/javascript', 'module']):
                if 'json' in open_tag.lower() or 'importmap' in open_tag.lower():
                    continue
            
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

