import codecs
import re

with codecs.open('store_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# Let's find exactly the duplicated block.
# In the original text, it was:
#                 <p style="font-size:0.95rem; color:#555; line-height:1.6;">
#                     Android搭載のサイネージパネルに<br>
# ...
#                     自動再開されます。
#                 </p>
# It appears after the "共通推奨スペック" block.

text = re.sub(r'<p style=\"font-size:0\.95rem; color:#555; line-height:1\.6;\">\s*Android搭載のサイネージパネルに.*?自動再開されます。\s*<\/p>', '', text, count=1, flags=re.DOTALL)

with codecs.open('store_portal.html', 'w', 'utf-8') as f:
    f.write(text)

print("Fixed")
