import os

filepath = 'c:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Match the duration validation block
pattern = re.compile(r'let isValid = true;.*?return false;\s*\}', re.DOTALL)
new_content = pattern.sub('// 制限を撤廃\n                console.log(`Video duration: ${duration.toFixed(1)}s (Duration limits removed)`);', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
