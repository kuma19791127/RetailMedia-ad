import sys
import re

with open('advertiser_lp.html', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = r'\n            <!-- Stray CSS removed for security and visual consistency -->.*?\n        }\n    </style>'

new_text = re.sub(pattern, '', text, flags=re.DOTALL)

with open('advertiser_lp.html', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Cleaned.')
