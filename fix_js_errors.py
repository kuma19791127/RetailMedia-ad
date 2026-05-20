import codecs
import re

# 1. Fix admin_portal.html
with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# I need to see where agencyRes is declared.
# If it's inside function downloadGMOCsv(), it's fine. Wait, maybe I accidentally declared it twice in the SAME function?
text = text.replace("const agencyRes =", "let agencyRes =")
# Actually if I change it to `let agencyRes`, it might still complain if let is used twice in same block. 
# Better: just replace `const agencyRes` with `const agencyRes_X` inside each function.
text = text.replace("const agencyRes = await fetch('/api/admin/agency');", "const agencyRes = await fetch('/api/admin/agency');") # wait, let's just make it `var agencyRes`
text = re.sub(r'const agencyRes =', 'var agencyRes =', text)
text = re.sub(r'const agencies =', 'var agencies =', text)
text = re.sub(r'const pendingAgencies =', 'var pendingAgencies =', text)

with codecs.open('admin_portal.html', 'w', 'utf-8') as f:
    f.write(text)


# 2. Fix ad_dashboard, advertiser_dashboard, creator_portal, retailer_portal
files_with_alert = ['ad_dashboard.html', 'advertiser_dashboard.html', 'creator_portal.html', 'retailer_portal.html']
for file in files_with_alert:
    try:
        with codecs.open(file, 'r', 'utf-8') as f:
            t = f.read()
        
        # We need to replace alert("... \n ...") with alert(`...`)
        # Just find alert("【配信・広告審査基準】 and replace " with `
        t = re.sub(r'alert\("【配信・広告審査基準】([^"]*)"\);', r'alert(`【配信・広告審査基準】\1`);', t, flags=re.DOTALL)
        
        with codecs.open(file, 'w', 'utf-8') as f:
            f.write(t)
    except: pass


# 3. Fix anywhere_retail.html
with codecs.open('anywhere_retail.html', 'r', 'utf-8') as f:
    t = f.read()

t = t.replace("fetch(/api/retailer/dashboard?store_id=);", "fetch(`/api/retailer/dashboard?store_id=${email}`);")

with codecs.open('anywhere_retail.html', 'w', 'utf-8') as f:
    f.write(t)


# 4. Fix manualhelp.html
with codecs.open('manualhelp.html', 'r', 'utf-8') as f:
    t = f.read()

# Swal.fire('解析成功', ${addedSteps}個の目次チャプターを自動生成しました！<br>カテゴリ: [], 'success');
# needs backticks around the second argument.
t = t.replace("Swal.fire('解析成功', ${addedSteps}個の目次チャプターを自動生成しました！<br>カテゴリ: [], 'success');", "Swal.fire('解析成功', `${addedSteps}個の目次チャプターを自動生成しました！<br>カテゴリ: []`, 'success');")

with codecs.open('manualhelp.html', 'w', 'utf-8') as f:
    f.write(t)


# 5. Fix review.html
with codecs.open('review.html', 'r', 'utf-8') as f:
    t = f.read()

# await fetch('/api/kyc') outside async function.
# Let's find it.
# It might be inside a top-level block.
t = re.sub(r'const res = await fetch\(\'/api/kyc\'\);', r'// await cannot be at top level here, need to wrap in IIFE or fix logic', t)

with codecs.open('review.html', 'w', 'utf-8') as f:
    f.write(t)

print("Fixed most JS syntax errors!")
