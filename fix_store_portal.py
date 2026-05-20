import codecs
import re

with codecs.open('store_portal.html', 'r', 'utf-8') as f:
    text = f.read()

bad_block_regex = r'<p style="font-size:0\.95rem; color:#555; line-height:1\.6;">\s*Android搭載のサイネージパネルに.*?自動再開されます。\s*</p>'
bad_blocks = re.findall(bad_block_regex, text, re.DOTALL)

if bad_blocks and len(bad_blocks) > 0:
    # Just remove the SECOND occurrence if there are duplicates of the text itself
    # Actually wait, let's just search and replace the duplicate text blocks if they are exactly identical.
    pass

# A safer way: Find the text "Android搭載のサイネージパネルに"
parts = text.split('Android搭載のサイネージパネルに')
if len(parts) > 2:
    print(f"Found {len(parts)-1} occurrences.")
    
# Let's fix it safely:
# The user's paste had:
# 🖥️ リテアドを稼働させる共通推奨スペック
# ...
# Android搭載のサイネージパネルに
# 専用アプリをインストールするだけで...

text = re.sub(r'(<p[^>]*>\s*Android搭載のサイネージパネルに.*?</p>\s*<div[^>]*>\s*💡 停電時の自動復旧について.*?</div>)\s*(<p[^>]*>\s*Android搭載のサイネージパネルに.*?</p>\s*<p[^>]*>\s*💡 停電時の自動復旧について.*?</p>)', r'\1', text, flags=re.DOTALL)

with codecs.open('store_portal.html', 'w', 'utf-8') as f:
    f.write(text)

print("Fixed duplication in store_portal.html")
