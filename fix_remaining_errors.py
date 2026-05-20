import codecs
import re

with codecs.open('anywhere_retail.html', 'r', 'utf-8') as f:
    t = f.read()

# Fix the JSX map function in anywhere_retail.html
# We want: 
# historyHtml = data.transactions.map(t => {
#    const d = new Date(parseInt(t.timestamp)).toLocaleString('ja-JP');
#    return `<div style="border-bottom:1px solid #eee; padding:5px 0; color:#333; text-align:left;">
#        <span style="font-size:12px; color:#888;">${d}</span><br>
#        金額: <strong style="color:#2563EB;">¥${t.totalAmount || 0}</strong>
#    </div>`;
# }).join('');

# It is currently broken.
broken_section = re.search(r'historyHtml = data\.transactions\.map\(t => \{.*?(?=}\)\.join\(\'\);)', t, re.DOTALL)
if broken_section:
    correct_section = """historyHtml = data.transactions.map(t => {
                    const d = new Date(parseInt(t.timestamp)).toLocaleString('ja-JP');
                    return `<div style="border-bottom:1px solid #eee; padding:5px 0; color:#333; text-align:left;">
                        <span style="font-size:12px; color:#888;">${d}</span><br>
                        金額: <strong style="color:#2563EB;">¥${t.totalAmount || 0}</strong>
                    </div>`;"""
    t = t.replace(broken_section.group(0), correct_section)

with codecs.open('anywhere_retail.html', 'w', 'utf-8') as f:
    f.write(t)


with codecs.open('review.html', 'r', 'utf-8') as f:
    t = f.read()

# Fix actionBtns = ` ... in review.html
broken_review = re.search(r'let actionBtns = `.*?(?=if\(kyc\.status ===)', t, re.DOTALL)
if broken_review:
    # it seems ` was left unclosed or something.
    pass

# Actually, I replaced `actionBtns = \\`` with `actionBtns = \``. Wait, in JS template literals, maybe they had:
# let actionBtns = ``;
t = re.sub(r'actionBtns = `\s*if\(kyc\.status ===', r'actionBtns = ``;\n                        if(kyc.status ===', t)

with codecs.open('review.html', 'w', 'utf-8') as f:
    f.write(t)
    
print("Fixed remaining")
