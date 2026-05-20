import codecs

with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

def patch_gmo(html_text):
    idx = html_text.find("async function downloadGMOCsv()")
    if idx == -1: return html_text
    end_idx = html_text.find("async function", idx + 10)
    if end_idx == -1: end_idx = html_text.find("</script>", idx)
    
    func_body = html_text[idx:end_idx]
    
    func_body = func_body.replace(
        "const pendingPayouts = payouts.filter(p => p.status === 'pending');",
        "const pendingPayouts = payouts.filter(p => p.status === 'pending');\n                const agencyRes = await fetch('/api/admin/agency');\n                const agencies = await agencyRes.json();\n                const pendingAgencies = agencies.filter(a => a.status === 'verified');"
    )
    
    func_body = func_body.replace(
        "未処理の出金申請 <b>${pendingPayouts.length}件</b>",
        "クリエイター <b>${pendingPayouts.length}件</b> および 代理店 <b>${pendingAgencies.length}件</b>"
    )
    
    func_body = func_body.replace(
        "if (pendingPayouts.length === 0) {",
        "if (pendingPayouts.length === 0 && pendingAgencies.length === 0) {"
    )
    
    target_loop_end = "});\n\n                    const blob = new Blob"
    if target_loop_end in func_body:
        agency_loop = """});
                    
                    // 代理店データをGMO CSVに追加
                    pendingAgencies.forEach(a => {
                        const amount = a.price || 0;
                        const finalAmount = amount - 145; // 振込手数料
                        const bankCode = "0000"; 
                        const branchCode = "000"; 
                        const accountType = "1"; 
                        const accountNum = "9999999"; // 仮
                        const holderName = a.agency_name ? a.agency_name.replace(/ /g, '') : "ダイリテン";
                        
                        csvContent += `${bankCode},${branchCode},${accountType},${accountNum},${holderName},${finalAmount}\\r\\n`;
                    });

                    const blob = new Blob"""
        func_body = func_body.replace(target_loop_end, agency_loop)
    
    return html_text[:idx] + func_body + html_text[end_idx:]

text = patch_gmo(text)

with codecs.open('admin_portal.html', 'w', 'utf-8') as f:
    f.write(text)

print("Patched GMO CSV")
