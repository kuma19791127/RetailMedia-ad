import codecs
import re

with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

target_header = """<button class="btn btn-primary" onclick="loadPayouts()">🔄 リロード</button>
                </div>"""
replace_header = """<button class="btn btn-primary" onclick="loadPayouts()">🔄 リロード</button>
                    <button class="btn btn-primary" onclick="downloadGMOCsv()" style="background:#27ae60; border:none; margin-left:10px;">📄 GMO一括振込CSV ダウンロード</button>
                </div>"""

text = text.replace(target_header, replace_header)

csv_script = """
        async function downloadGMOCsv() {
            try {
                const res = await fetch('/api/admin/payouts');
                const payouts = await res.json();
                
                const pendingPayouts = payouts.filter(p => p.status === 'pending');
                if (pendingPayouts.length === 0) {
                    Swal.fire('データなし', '現在、承認待ちの出金申請はありません。', 'info');
                    return;
                }

                const confirm = await Swal.fire({
                    title: 'GMO一括振込CSVの生成',
                    html: `未処理の出金申請 <b>${pendingPayouts.length}件</b> をGMOあおぞらネット銀行の指定フォーマット（CSV）で出力します。<br><br><span style="font-size:0.8rem; color:#666;">※ダウンロード後、GMOの管理画面から「一括振込・総合振込」＞「GMOあおぞらネット銀行指定形式（CSV）」を選択してアップロードしてください。</span>`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'CSVダウンロード'
                });

                if (confirm.isConfirmed) {
                    // GMO指定CSVの標準的フォーマット（金融機関コード,支店コード,預金種別(1=普通),口座番号,受取人名,金額）
                    let csvContent = "\\uFEFF"; // BOM for Excel compatibility if needed
                    // ヘッダー行なし、または指定フォーマットに従う（GMO形式は基本的にデータ行のみ、または1行目から）
                    
                    pendingPayouts.forEach(p => {
                        const bank = p.bankInfo;
                        const isCorp = bank.businessType === 'corporate';
                        const withholdingTax = isCorp ? 0 : Math.floor(p.amount * 0.1021);
                        const finalAmount = p.amount - withholdingTax - 145; // 145円=振込手数料と仮定
                        
                        // GMO CSV: [振込先銀行コード],[振込先支店コード],[科目(1:普通)],[口座番号],[受取人名(半角カナ)],[金額]
                        const bankCode = "0000"; // 仮
                        const branchCode = "000"; // 仮
                        const accountType = "1"; // 1=普通
                        const accountNum = bank.accountNum || "";
                        const holderName = bank.holderName ? bank.holderName.replace(/ /g, '') : ""; // スペース除去
                        
                        csvContent += `${bankCode},${branchCode},${accountType},${accountNum},${holderName},${finalAmount}\\r\\n`;
                    });

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `gmo_payout_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    Swal.fire('出力完了', 'CSVファイルをダウンロードしました。GMOのシステムにアップロード後、各申請の「ステータス」を処理済みに更新してください。', 'success');
                }
            } catch (e) {
                console.error(e);
                Swal.fire('エラー', 'CSVの生成に失敗しました。', 'error');
            }
        }
"""

idx = text.rfind("</script>")
if idx != -1:
    text = text[:idx] + csv_script + "\n" + text[idx:]

with codecs.open('admin_portal.html', 'w', 'utf-8') as f:
    f.write(text)

print("Patched admin_portal.html with CSV download")
