import codecs

with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# Update downloadGMOCsv
target_gmo_start = "const pendingPayouts = payouts.filter(p => p.status === 'pending');"
replace_gmo_start = """const pendingPayouts = payouts.filter(p => p.status === 'pending');
                
                // 代理店の未払い報酬（ステータスが verified のもの）も取得
                const agencyRes = await fetch('/api/admin/agency');
                const agencies = await agencyRes.json();
                const pendingAgencies = agencies.filter(a => a.status === 'verified');
                
                if (pendingPayouts.length === 0 && pendingAgencies.length === 0) {
                    Swal.fire('データなし', '現在、処理待ちの出金申請や代理店報酬はありません。', 'info');
                    return;
                }"""
if target_gmo_start in text:
    text = text.replace(target_gmo_start, replace_gmo_start)

target_gmo_confirm = "html: `未処理の出金申請 <b>${pendingPayouts.length}件</b> をGMOあおぞらネット銀行の指定フォーマット（CSV）で出力します。"
replace_gmo_confirm = "html: `クリエイター出金 <b>${pendingPayouts.length}件</b> および 代理店報酬 <b>${pendingAgencies.length}件</b> をGMOあおぞらネット銀行の指定フォーマット（CSV）で出力します。"
if target_gmo_confirm in text:
    text = text.replace(target_gmo_confirm, replace_gmo_confirm)

target_gmo_loop = """});

                    const blob"""
replace_gmo_loop = """});

                    // 代理店のデータをCSVに追加
                    pendingAgencies.forEach(a => {
                        const amount = a.price || 0;
                        const finalAmount = amount - 145; // 仮の振込手数料
                        // 代理店の銀行口座情報は現在UI未実装のため仮の値をセット
                        const bankCode = "0000"; 
                        const branchCode = "000"; 
                        const accountType = "1"; 
                        const accountNum = "9999999"; // 要確認
                        const holderName = a.agency_name ? a.agency_name.replace(/ /g, '') : "ダイリテン";
                        
                        csvContent += `${bankCode},${branchCode},${accountType},${accountNum},${holderName},${finalAmount}\\r\\n`;
                    });

                    const blob"""
if target_gmo_loop in text:
    text = text.replace(target_gmo_loop, replace_gmo_loop)

# Update downloadFreeeCsv
target_freee_start = "const pendingPayouts = payouts.filter(p => p.status === 'pending');"
replace_freee_start = """const pendingPayouts = payouts.filter(p => p.status === 'pending');
                
                const agencyRes = await fetch('/api/admin/agency');
                const agencies = await agencyRes.json();
                const pendingAgencies = agencies.filter(a => a.status === 'verified');

                if (pendingPayouts.length === 0 && pendingAgencies.length === 0) {
                    Swal.fire('データなし', '現在、処理待ちの出金申請や代理店報酬はありません。', 'info');
                    return;
                }"""
if target_freee_start in text:
    # Need to only replace the second occurrence, which is inside downloadFreeeCsv
    # Actually it's better to just do a strict replace
    pass

def patch_freee(html_text):
    # Find downloadFreeeCsv function
    idx = html_text.find("async function downloadFreeeCsv()")
    if idx == -1: return html_text
    end_idx = html_text.find("async function", idx + 10)
    if end_idx == -1: end_idx = html_text.find("</script>", idx)
    
    func_body = html_text[idx:end_idx]
    
    # 1. replace start
    func_body = func_body.replace(
        "const pendingPayouts = payouts.filter(p => p.status === 'pending');",
        "const pendingPayouts = payouts.filter(p => p.status === 'pending');\n                const agencyRes = await fetch('/api/admin/agency');\n                const agencies = await agencyRes.json();\n                const pendingAgencies = agencies.filter(a => a.status === 'verified');"
    )
    
    # 2. replace confirm text
    func_body = func_body.replace(
        "未処理 <b>${pendingPayouts.length}件</b> の源泉徴収",
        "クリエイター <b>${pendingPayouts.length}件</b> および 代理店 <b>${pendingAgencies.length}件</b> の源泉徴収"
    )
    
    # 3. replace condition
    func_body = func_body.replace(
        "if (pendingPayouts.length === 0) {",
        "if (pendingPayouts.length === 0 && pendingAgencies.length === 0) {"
    )
    
    # 4. add agency loop
    target_loop_end = "});\n\n                    const blob = new Blob"
    if target_loop_end in func_body:
        agency_loop = """});
                    
                    let slipNoOffset = pendingPayouts.length;
                    pendingAgencies.forEach((a, index) => {
                        const slipNo = slipNoOffset + index + 1;
                        const amount = a.price || 0;
                        const isCorp = true; // 仮: 代理店は基本法人とみなす（必要に応じてUI追加）
                        const withholdingTax = isCorp ? 0 : Math.floor(amount * 0.1021);
                        const bankFee = 145; 
                        const finalAmount = amount - withholdingTax - bankFee;
                        const memo = `${a.agency_name} 代理店紹介マージン`;

                        csvContent += `${slipNo},${today},支払報酬,${amount},課税仕入,未払金,${finalAmount},対象外,${memo}\\r\\n`;
                        if (withholdingTax > 0) csvContent += `${slipNo},${today},,,,預り金,${withholdingTax},対象外,${memo}(源泉税)\\r\\n`; 
                        if (bankFee > 0) csvContent += `${slipNo},${today},,,,支払手数料,${bankFee},対象外,${memo}(振込手数料)\\r\\n`;
                    });

                    const blob = new Blob"""
        func_body = func_body.replace(target_loop_end, agency_loop)
    
    return html_text[:idx] + func_body + html_text[end_idx:]

text = patch_freee(text)

with codecs.open('admin_portal.html', 'w', 'utf-8') as f:
    f.write(text)

print("Patched admin_portal.html with agency CSV integration")
