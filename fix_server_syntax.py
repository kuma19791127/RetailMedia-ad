import codecs

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

bad_snippet = """    withdrawalRequests.push({
        setTimeout(saveFinanceDB, 100);
    withdrawalRequests.push({"""

fixed_snippet = """    setTimeout(saveFinanceDB, 100);
    withdrawalRequests.push({"""

if bad_snippet in text:
    text = text.replace(bad_snippet, fixed_snippet)

# Wait, let's also check if I messed up agencyReferrals.push({
bad_agency = """    agencyReferrals.push({
        setTimeout(saveFinanceDB, 100);
    agencyReferrals.push({"""
if bad_agency in text:
    text = text.replace(bad_agency, """    setTimeout(saveFinanceDB, 100);
    agencyReferrals.push({""")

# Wait, let's just use python to fix any accidental nesting:
import re
text = re.sub(r'(\s*\w+\.push\(\{)\s*setTimeout\(saveFinanceDB, 100\);\s*\w+\.push\(\{', r'\n    setTimeout(saveFinanceDB, 100);\1', text)

with codecs.open('server_retail_dist.js', 'w', 'utf-8') as f:
    f.write(text)
    
print("Fixed syntax error")
