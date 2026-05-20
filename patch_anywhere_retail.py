import codecs
import re

with codecs.open('anywhere_retail.html', 'r', 'utf-8') as f:
    text = f.read()

# Add a reconciliation button next to the others
target_btns = """<button class="btn" onclick="fetchScanHistory()" style="background:#2563EB;">履歴の確認 (History)</button>
        </div>"""
replace_btns = """<button class="btn" onclick="fetchScanHistory()" style="background:#2563EB;">履歴の確認 (History)</button>
            <button class="btn" onclick="reconcileSales()" style="background:#EAB308; margin-top:10px;">📊 売上とスキャン履歴の照合</button>
        </div>"""
if target_btns in text:
    text = text.replace(target_btns, replace_btns)

# Add reconcileSales function
reconcile_script = """
    async function reconcileSales() {
        const email = document.getElementById('user-email-display').innerText.split(' / ')[1] || document.getElementById('input-email').value;
        try {
            Swal.fire({title: 'データ照合中...', html: 'POSサーバーの売上計上と<br>各スキャン履歴の整合性を確認しています...', didOpen: () => Swal.showLoading()});
            
            // Get data from backend POS endpoints
            const posRes = await fetch('/api/pos/transactions');
            const posData = await posRes.json();
            
            // Filter transactions for this retailer's email
            const myTransactions = posData.filter(t => t.billingEmail === email);
            const scanTotal = myTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
            
            // Note: If you want to check against daily sales, you'd filter by today's date
            // For now, we compare total logged POS transactions with expected sales
            
            const dashRes = await fetch(`/api/retailer/dashboard?store_id=${email}`);
            const dashData = await dashRes.json();
            const dashTotal = dashData.sales || 0; // Using current mock from S3 mock

            if (scanTotal === dashTotal) {
                Swal.fire('✅ 照合一致', `売上計上額 (¥${dashTotal}) と<br>スキャン履歴合計 (¥${scanTotal}) が完全に一致しています。`, 'success');
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ 照合不一致エラー',
                    html: `売上計上額 (¥${dashTotal}) と<br>スキャン履歴合計 (¥${scanTotal}) が合致しません！<br><br><span style="font-size:0.85rem; color:#d97706;">ネットワークエラーで決済データが欠落しているか、手動での修正が必要です。</span>`
                });
            }
        } catch(e) {
            Swal.fire('エラー', '照合処理に失敗しました', 'error');
        }
    }
"""
idx = text.rfind("</script>")
if idx != -1:
    text = text[:idx] + reconcile_script + "\n" + text[idx:]

with codecs.open('anywhere_retail.html', 'w', 'utf-8') as f:
    f.write(text)

print("Patched anywhere_retail.html with reconciliation")
