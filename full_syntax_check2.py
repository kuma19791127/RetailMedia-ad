import os
import glob
import re
import subprocess
import codecs

def check_syntax():
    print("Starting Syntax Check...")
    errors = []
    
    # Check standalone JS files
    for filepath in glob.glob("*.js"):
        if "node_modules" in filepath: continue
        res = subprocess.run(["node", "-c", filepath], capture_output=True, text=True, encoding='utf-8')
        if res.returncode != 0:
            errors.append(f"Error in {filepath}:\n{res.stderr}")
            
    # Check inline scripts in HTML
    for filepath in glob.glob("*.html"):
        try:
            with codecs.open(filepath, 'r', encoding='utf-8') as f:
                text = f.read()
            scripts = re.findall(r'<script[^>]*>(.*?)</script>', text, re.DOTALL | re.IGNORECASE)
            for i, script in enumerate(scripts):
                if script.strip() == "": continue
                temp_file = f"temp_script_{i}.js"
                with codecs.open(temp_file, 'w', encoding='utf-8') as tf:
                    tf.write(script)
                res = subprocess.run(["node", "-c", temp_file], capture_output=True, text=True, encoding='utf-8')
                if res.returncode != 0:
                    errors.append(f"Error in {filepath} (script #{i+1}):\n{res.stderr}")
                if os.path.exists(temp_file):
                    os.remove(temp_file)
        except Exception as e:
            errors.append(f"Could not process {filepath}: {e}")

    with codecs.open("syntax_check_results.txt", "w", encoding="utf-8") as f:
        if not errors:
            f.write("No syntax errors found in any JS or HTML files.\n")
        else:
            f.write(f"Found {len(errors)} syntax errors:\n")
            for e in errors:
                f.write(e + "\n")
                f.write("-" * 40 + "\n")
    print("Check complete. See syntax_check_results.txt")

if __name__ == "__main__":
    check_syntax()
