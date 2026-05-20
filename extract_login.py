import codecs
import re

files = ['admin_portal.html', 'retailer_portal.html', 'review.html', 'creator_portal.html']
for file in files:
    try:
        with codecs.open(file, 'r', 'utf-8') as f:
            text = f.read()
        
        matches = re.finditer(r'<div[^>]*id=["\']login-modal["\'][^>]*>.*?<button[^>]*>.*?<\/button>', text, re.IGNORECASE | re.DOTALL)
        for m in matches:
            print(f"--- {file} ---")
            print(m.group(0))
    except Exception as e:
        pass
