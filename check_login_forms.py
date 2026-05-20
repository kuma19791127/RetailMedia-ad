import codecs
import re

files_to_check = ['admin_portal.html', 'retailer_portal.html', 'review.html', 'ad_dashboard.html', 'creator_portal.html', 'agency_portal.html']

for file in files_to_check:
    try:
        with codecs.open(file, 'r', 'utf-8') as f:
            text = f.read()
        
        # Look for login form elements
        login_section = re.search(r'(<div[^>]*login[^>]*>.*?</div>)', text, re.IGNORECASE | re.DOTALL)
        if login_section:
            snippet = login_section.group(1)[:500]
            print(f"--- {file} ---")
            print("Contains <form>?:", "<form" in snippet)
            print("Autocomplete username?:", 'autocomplete="username"' in snippet)
            print("Autocomplete password?:", 'autocomplete="current-password"' in snippet)
    except Exception as e:
        print(f"Error reading {file}: {e}")

