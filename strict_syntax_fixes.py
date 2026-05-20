import codecs
import re

# 1. Fix admin_portal.html duplicate declaration
with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# Let's replace 'var agencyRes =' back to const, but use unique names inside the two download functions.
# Function 1: downloadGMOCsv
text = text.replace('var agencyRes = await fetch(\'/api/admin/agency\');', 'const localAgencyRes = await fetch(\'/api/admin/agency\');')
text = text.replace('var agencies = await agencyRes.json();', 'const localAgencies = await localAgencyRes.json();')
# Wait, let's just make it simpler.
text = re.sub(r'var agencyRes = await fetch\(\'/api/admin/agency\'\);', r'const agencyResTmp = await fetch(\'/api/admin/agency\');', text)
text = re.sub(r'let agencyRes = await fetch\(\'/api/admin/agency\'\);', r'const agencyResTmp = await fetch(\'/api/admin/agency\');', text)
text = re.sub(r'const agencyRes = await fetch\(\'/api/admin/agency\'\);', r'const agencyResTmp = await fetch(\'/api/admin/agency\');', text)

text = re.sub(r'var agencies = await agencyRes\.json\(\);', r'const agencies = await agencyResTmp.json();', text)
text = re.sub(r'let agencies = await agencyRes\.json\(\);', r'const agencies = await agencyResTmp.json();', text)
text = re.sub(r'const agencies = await agencyRes\.json\(\);', r'const agencies = await agencyResTmp.json();', text)

# I also need to replace pendingAgencies
text = re.sub(r'var pendingAgencies =', r'const pendingAgencies =', text)

with codecs.open('admin_portal.html', 'w', 'utf-8') as f:
    f.write(text)


# 2. Fix anywhere_retail.html JSX syntax
with codecs.open('anywhere_retail.html', 'r', 'utf-8') as f:
    text = f.read()

bad_jsx = """return <div style="border-bottom:1px solid #eee; padding:5px 0; color:#333; text-align:left;">
                        <span style="font-size:12px; color:#888;"></span><br>
                        金額: <strong style="color:#2563EB;">¥</strong>
                    </div>;"""

# Need to replace it with proper template literal. Let's see what's actually there.
text = re.sub(r'return <div (style="border-bottom:1px solid #eee; padding:5px 0; color:#333; text-align:left;">)', r'return `<div \1`', text)
text = re.sub(r'金额: <strong style="color:#2563EB;">¥<\/strong>\s*<\/div>;', r'金額: <strong style="color:#2563EB;">¥${t.totalAmount || 0}</strong>\n                    </div>`;', text)
text = re.sub(r'金額: <strong style="color:#2563EB;">¥<\/strong>\s*<\/div>;', r'金額: <strong style="color:#2563EB;">¥${t.totalAmount || 0}</strong>\n                    </div>`;', text)
text = re.sub(r'<span style="font-size:12px; color:#888;"><\/span><br>', r'<span style="font-size:12px; color:#888;">${d}</span><br>', text)

# Just in case my regex didn't catch it:
jsx_pattern = r'return\s*<div\s*style="border-bottom:1px solid #eee; padding:5px 0; color:#333; text-align:left;">\s*<span style="font-size:12px; color:#888;"><\/span><br>\s*金額:\s*<strong style="color:#2563EB;">¥<\/strong>\s*<\/div>;'
jsx_replacement = r'return `<div style="border-bottom:1px solid #eee; padding:5px 0; color:#333; text-align:left;"><span style="font-size:12px; color:#888;">${d}</span><br>金額: <strong style="color:#2563EB;">¥${t.totalAmount}</strong></div>`;'
text = re.sub(jsx_pattern, jsx_replacement, text)

# Also fix the JSX in Swal.fire html
text = re.sub(r'html:\s*<div\s*style="max-height:200px; overflow-y:auto; font-size:14px; text-align:left;"><\/div>', r'html: `<div style="max-height:200px; overflow-y:auto; font-size:14px; text-align:left;">${historyHtml}</div>`', text)


with codecs.open('anywhere_retail.html', 'w', 'utf-8') as f:
    f.write(text)


# 3. Fix review.html backslash before backtick
with codecs.open('review.html', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace('actionBtns = \\`', 'actionBtns = `')

with codecs.open('review.html', 'w', 'utf-8') as f:
    f.write(text)

print("Applied strict syntax fixes.")
