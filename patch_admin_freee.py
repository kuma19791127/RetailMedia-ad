import codecs

with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

target_btn = '<button class="btn btn-primary" onclick="downloadGMOCsv()" style="background:#27ae60; border:none; margin-left:10px;">📄 GMO一括振込CSV ダウンロード</button>'
replace_btn = target_btn + '\n                    <button class="btn btn-primary" onclick="downloadFreeeCsv()" style="background:#3498db; border:none; margin-left:10px;">📊 freee仕訳CSV ダウンロード</button>'

if target_btn in text:
    text = text.replace(target_btn, replace_btn)

freee_script = """
        async function downloadFreeeCsv() {
            try {
                const res = await fetch('/api/admin/payouts');
                const payouts = await res.json();
                
                const pendingPayouts = payouts.filter(p => p.status === 'pending');
                if (pendingPayouts.length === 0) {
                    Swal.fire('データなし', '現在、未処理の出金申請はありません。', 'info');
                    return;
                }

                const confirm = await Swal.fire({
                    title: 'freee仕訳CSVの生成',
                    html: `未処理 <b>${pendingPayouts.length}件</b> の源泉徴収・手数料を自動計算し、freeeの「振替伝票」インポート用CSVを出力します。<br><br><span style="font-size:0.8rem; color:#666;">※freeeの「決算申告＞振替伝票」からインポートできます。</span>`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'CSVダウンロード'
                });

                if (confirm.isConfirmed) {
                    // freee振替伝票フォーマット
                    let csvContent = "\\uFEFF伝票No,発生日,借方勘定科目,借方金額,借方税区分,貸方勘定科目,貸方金額,貸方税区分,備考\\r\\n";
                    
                    const today = new Date().toISOString().split('T')[0];
                    
                    pendingPayouts.forEach((p, index) => {
                        const slipNo = index + 1;
                        const isCorp = p.bankInfo.businessType === 'corporate';
                        const withholdingTax = isCorp ? 0 : Math.floor(p.amount * 0.1021);
                        const bankFee = 145; // 振込手数料目安
                        const finalAmount = p.amount - withholdingTax - bankFee;
                        const memo = `${p.bankInfo.holderName} 報酬支払`;

                        // 1行目: 借方(支払報酬) vs 貸方(未払金)
                        csvContent += `${slipNo},${today},支払報酬,${p.amount},課税仕入,未払金,${finalAmount},対象外,${memo}\\r\\n`;
                        
                        // 2行目: 貸方のみ(源泉徴収)
                        if (withholdingTax > 0) {
                            csvContent += `${slipNo},${today},,,,預り金,${withholdingTax},対象外,${memo}(源泉税)\\r\\n`; 
                        }
                        
                        // 3行目: 貸方のみ(振込手数料)
                        if (bankFee > 0) {
                            csvContent += `${slipNo},${today},,,,支払手数料,${bankFee},対象外,${memo}(振込手数料)\\r\\n`;
                        }
                    });

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `freee_journal_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    Swal.fire('出力完了', 'freee用の仕訳CSVをダウンロードしました。', 'success');
                }
            } catch (e) {
                console.error(e);
                Swal.fire('エラー', 'CSVの生成に失敗しました。', 'error');
            }
        }
"""

idx = text.rfind("</script>")
if idx != -1:
    text = text[:idx] + freee_script + "\n" + text[idx:]

with codecs.open('admin_portal.html', 'w', 'utf-8') as f:
    f.write(text)

print('Patched admin_portal.html with freee CSV')
