import codecs
import re
import os

# Delete temporary js scripts
files_to_delete = ['patch_creator.js', 'patch_manual_pdf.js', 'patch_optimistic.js', 'patch_pdf_ai.js', 'repair.js', 'temp_script.js', 'review_script.js']
for f in files_to_delete:
    if os.path.exists(f): os.remove(f)

# Fix admin_portal.html
with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()
# Replace "const agencyResTmp = await fetch('/api/admin/agency');" with "agencyResTmp = await fetch('/api/admin/agency');" if it occurs more than once
parts = text.split("const agencyResTmp = await fetch('/api/admin/agency');")
if len(parts) > 2:
    # First one stays const, second one becomes assignment
    new_text = parts[0] + "const agencyResTmp = await fetch('/api/admin/agency');" + parts[1] + "agencyResTmp = await fetch('/api/admin/agency');" + parts[2]
    with codecs.open('admin_portal.html', 'w', 'utf-8') as f: f.write(new_text)
elif len(parts) == 2:
    # Check if there is another const agencyResTmp
    text = text.replace("const agencyResTmp = await fetch('/api/admin/agency');", "let agencyResTmp = await fetch('/api/admin/agency');", 1)
    with codecs.open('admin_portal.html', 'w', 'utf-8') as f: f.write(text)

# Fix anywhere_retail.html
with codecs.open('anywhere_retail.html', 'r', 'utf-8') as f:
    text = f.read()
# Let's fix the JSX map issue.
old_jsx = '''historyHtml = data.transactions.map(t => {
                        const d = new Date(t.created_at).toLocaleString();
                        return 
                        <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <span style="font-size:12px; color:#888;">${d}</span><br>
                                <strong>${t.item_name}</strong> (x${t.quantity})
                            </div>
                            <div style="text-align:right;">
                                <span style="color:#10b981; font-weight:bold;">¥${t.total_price.toLocaleString()}</span><br>
                                <span style="font-size:11px; color:#aaa;">Terminal: ${t.terminal_id}</span>
                            </div>
                        </div>
                    }).join('');'''
                    
new_jsx = '''historyHtml = data.transactions.map(t => {
                        const d = new Date(t.created_at).toLocaleString();
                        return `
                        <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <span style="font-size:12px; color:#888;">${d}</span><br>
                                <strong>${t.item_name}</strong> (x${t.quantity})
                            </div>
                            <div style="text-align:right;">
                                <span style="color:#10b981; font-weight:bold;">¥${t.total_price.toLocaleString()}</span><br>
                                <span style="font-size:11px; color:#aaa;">Terminal: ${t.terminal_id}</span>
                            </div>
                        </div>`;
                    }).join('');'''
if old_jsx in text:
    text = text.replace(old_jsx, new_jsx)
else:
    # Just in case, replace any "return \n                        <div" with "return `..."
    text = text.replace("return \n                        <div", "return `\n                        <div").replace("</div>\n                    }).join", "</div>`;\n                    }).join")

with codecs.open('anywhere_retail.html', 'w', 'utf-8') as f: f.write(text)

# Fix review.html
with codecs.open('review.html', 'r', 'utf-8') as f:
    text = f.read()
# The issue was missing } at the end of loadKYCReq function, and the setInterval block.
if "setInterval(loadKYCReq, 5000);" in text and "}\n    // Load on start" not in text:
    # it seems the updateKyc function was missing a closing brace?
    # No, loadKYCReq was fine. The issue was that the whole script tag ended abruptly, OR we just need to append a brace.
    pass

# Actually, the error was:
# SyntaxError: Unexpected end of input at the end of review.html script #3
# Let's just append "}" before the closing </script> if it's unbalanced.
# I will just write a regex to find the setInterval and ensure the brace is there.
text = text.replace("setInterval(loadKYCReq, 5000);\n</script>", "setInterval(loadKYCReq, 5000);\n}\n</script>")
with codecs.open('review.html', 'w', 'utf-8') as f: f.write(text)

print("Fixed final issues")
