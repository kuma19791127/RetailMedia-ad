# -*- coding: utf-8 -*-
import codecs
import re

def fix_retailer():
    with codecs.open('retailer_portal.html', 'r', 'utf-8') as f:
        content = f.read()
    
    # Remove the problematic line
    content = content.replace("document.getElementById('retailer-prefix').value = currentPrefix;", "")
    
    # Replace the text
    content = re.sub(
        r'Android搭載のサイネージパネル.*?開始されます。',
        'Android搭載のサイネージパネルに<br>\n                    専用アプリをインストールするだけで<br>\n                    自動的にサイネージと登録され<br>\n                    広告配信事業が開始されます。',
        content,
        flags=re.DOTALL
    )
    
    with codecs.open('retailer_portal.html', 'w', 'utf-8') as f:
        f.write(content)

def fix_store():
    with codecs.open('store_portal.html', 'r', 'utf-8') as f:
        content = f.read()
    
    content = re.sub(
        r'Android搭載のサイネージパネル.*?開始されます。',
        'Android搭載のサイネージパネルに<br>\n                    専用アプリをインストールするだけで<br>\n                    自動的にサイネージと登録され<br>\n                    広告配信事業が開始されます。',
        content,
        flags=re.DOTALL
    )
    
    with codecs.open('store_portal.html', 'w', 'utf-8') as f:
        f.write(content)

fix_retailer()
fix_store()
