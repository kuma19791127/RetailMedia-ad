import codecs
import re

# Fix admin_portal.html
with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# Replace escaped fetch call
text = text.replace(r"await fetch(\'/api/admin/agency\');", "await fetch('/api/admin/agency');")
text = text.replace(r"await fetch(\'/api/admin/pos_config\');", "await fetch('/api/admin/pos_config');")

with codecs.open('admin_portal.html', 'w', 'utf-8') as f:
    f.write(text)

# Fix anywhere_retail.html
with codecs.open('anywhere_retail.html', 'r', 'utf-8') as f:
    text = f.read()

# It's currently written as JSX in plain JS without backticks
# match historyHtml = data.transactions.map(t => { ... })
jsx_block_regex = r'historyHtml = data\.transactions\.map\(t => \{\s*const d = new Date\(t\.created_at\)\.toLocaleString\(\);\s*return\s*<div[^>]*>.*?</div>\s*\}\)\.join\(\'\'\);'

# Let's just find the `return \n <div` and wrap it in backticks if it isn't.
# Looking at the exact error line: `<span style="font-size:12px; color:#888;">${d}</span><br>`
def replacer(match):
    inner = match.group(0)
    if 'return `' not in inner:
        inner = inner.replace('return \n', 'return `\n').replace('return\n', 'return `\n').replace('return ', 'return `').replace('</div>\n', '</div>`\n')
    return inner

# Wait, I previously wrote a patch for anywhere_retail.html but maybe it was overwritten?
# Let's just search and replace the raw HTML return.
jsx = '''return 
                        <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <span style="font-size:12px; color:#888;">${d}</span><br>
                                <strong>${t.item_name}</strong> (x${t.quantity})
                            </div>
                            <div style="text-align:right;">
                                <span style="color:#10b981; font-weight:bold;">¥${t.total_price.toLocaleString()}</span><br>
                                <span style="font-size:11px; color:#aaa;">Terminal: ${t.terminal_id}</span>
                            </div>
                        </div>'''

fixed_jsx = '''return `
                        <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <span style="font-size:12px; color:#888;">${d}</span><br>
                                <strong>${t.item_name}</strong> (x${t.quantity})
                            </div>
                            <div style="text-align:right;">
                                <span style="color:#10b981; font-weight:bold;">¥${t.total_price.toLocaleString()}</span><br>
                                <span style="font-size:11px; color:#aaa;">Terminal: ${t.terminal_id}</span>
                            </div>
                        </div>`'''

text = text.replace(jsx, fixed_jsx)
with codecs.open('anywhere_retail.html', 'w', 'utf-8') as f:
    f.write(text)

# Fix review.html
with codecs.open('review.html', 'r', 'utf-8') as f:
    text = f.read()

# Review has Unexpected end of input. Usually a missing closing brace.
# Let's see what is near line 145.
# Let's print out script 3 to console
scripts = re.findall(r'<script[^>]*>(.*?)</script>', text, re.DOTALL | re.IGNORECASE)
print(scripts[2][-200:])

