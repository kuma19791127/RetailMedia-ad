import os, subprocess, codecs

js_files = [f for f in os.listdir('.') if f.endswith('.js')]
errors = []

for js in js_files:
    res = subprocess.run(['node', '-c', js], capture_output=True, encoding='utf-8', errors='replace')
    if res.returncode != 0:
        errors.append(f'--- Error in {js} ---\n{res.stderr}\n')

with codecs.open('js_errors.txt', 'w', 'utf-8') as f:
    if errors:
        f.write('\n'.join(errors))
    else:
        f.write('ALL JS FILES OK\n')

# Check HTML scripts again just in case
html_files = [f for f in os.listdir('.') if f.endswith('.html')]
html_errors = []
for file in html_files:
    try:
        with codecs.open(file, 'r', 'utf-8') as f:
            text = f.read()
        import re
        scripts = re.findall(r'<script[^>]*>(.*?)<\/script>', text, re.IGNORECASE | re.DOTALL)
        for i, script in enumerate(scripts):
            if script.strip() == '': continue
            temp_name = f"temp_check_{i}.js"
            with codecs.open(temp_name, 'w', 'utf-8') as tf:
                tf.write(script)
            res = subprocess.run(['node', '-c', temp_name], capture_output=True, encoding='utf-8', errors='replace')
            if res.returncode != 0:
                html_errors.append(f'--- Error in {file} (script {i}) ---\n{res.stderr}\n')
            if os.path.exists(temp_name): os.remove(temp_name)
    except: pass

with codecs.open('js_errors.txt', 'a', 'utf-8') as f:
    if html_errors:
        f.write('\nHTML SCRIPT ERRORS:\n' + '\n'.join(html_errors))
    else:
        f.write('ALL HTML SCRIPTS OK\n')
