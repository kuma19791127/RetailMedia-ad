import os
import glob
import re
import subprocess

def check_syntax():
    print("Starting Syntax Check...")
    errors = []
    
    # Check standalone JS files
    for filepath in glob.glob("*.js"):
        if "node_modules" in filepath: continue
        res = subprocess.run(["node", "-c", filepath], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f"Error in {filepath}:\n{res.stderr}")
            
    # Check inline scripts in HTML
    for filepath in glob.glob("*.html"):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                text = f.read()
            # Find script tags along with their opening tag attributes
            scripts = re.findall(r'(<script[^>]*>)(.*?)</script>', text, re.DOTALL | re.IGNORECASE)
            for i, (open_tag, script) in enumerate(scripts):
                if script.strip() == "": continue
                if 'application/ld+json' in open_tag: continue
                temp_file = f"temp_script_{i}.js"
                with open(temp_file, 'w', encoding='utf-8') as tf:
                    tf.write(script)
                res = subprocess.run(["node", "-c", temp_file], capture_output=True, text=True)
                if res.returncode != 0:
                    preview = script.strip()[:150].replace('\n', ' ')
                    errors.append(f"Error in {filepath} (script #{i+1}, preview: '{preview}...'):\n{res.stderr}")
                os.remove(temp_file)
        except Exception as e:
            errors.append(f"Could not process {filepath}: {e}")

    if not errors:
        print("[OK] No syntax errors found in any JS or HTML files.")
    else:
        print(f"[ERROR] Found {len(errors)} syntax errors:")
        for e in errors:
            print(e)
            print("-" * 40)

if __name__ == "__main__":
    check_syntax()
