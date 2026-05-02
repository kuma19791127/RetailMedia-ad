import os
import re

files = [
    'c:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/creator_portal.html'
]

pattern = re.compile(r'let isValid = true;.*?return false;\s*\}', re.DOTALL)
pattern_creator = re.compile(r'if \(duration > 60\).*?return false;\s*\}', re.DOTALL)

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = pattern.sub('// Duration limits removed by request', content)
        new_content = pattern_creator.sub('// Creator duration limit removed by request', new_content)

        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
        else:
            print(f"No match found in {filepath}")
