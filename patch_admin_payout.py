import codecs
import re

with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# 1. Add the menu item
target_menu = """<li onclick="switchTab('tab-agencies')">🤝 代理店申請一覧</li>"""
replace_menu = """<li onclick="switchTab('tab-agencies')">🤝 代理店申請一覧</li>
                <li onclick="switchTab('tab-payouts')">🏦 出金申請・支払承認</li>"""

text = text.replace(target_menu, replace_menu)

# 2. Add the payout tab section
target_section = """<div id="tab-agencies" class="tab-content">"""
replace_section = """<div id="tab-payouts" class="tab-content">
            <div class="card">
                <div class="card-header">
                    <h2>🏦 クリエイター出金申請・支払承認</h2>
                    <button class="btn btn-primary" onclick="loadPayouts()">🔄 リロード</button>
                </div>
                <div class="card-body">
                    <p style="font-size:0.9rem; color:#666; margin-bottom:15px;">※「送金実行」を押すと、GMOあおぞらネット銀行API経由で振込指示が行われ、同時にfreee会計APIへ振替伝票（源泉徴収・振込手数料含む）が自動起票されます。</p>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>申請日時</th>
                                <th>クリエイターEmail</th>
                                <th>申請額</th>
                                <th>T番号(インボイス)</th>
                                <th>銀行名・名義</th>
                                <th>源泉徴収(見込)</th>
                                <th>ステータス</th>
                                <th>アクション</th>
                            </tr>
                        </thead>
                        <tbody id="payout-list">
                            <!-- JS injected -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div id="tab-agencies" class="tab-content">"""

text = text.replace(target_section, replace_section)

# 3. Add the javascript logic
payout_script = """
        async function loadPayouts() {
            try {
                const res = await fetch('/api/admin/payouts');
                const payouts = await res.json();
                const tbody = document.getElementById('payout-list');
                tbody.innerHTML = '';
                
                if (payouts.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">現在、出金申請はありません。</td></tr>';
                    return;
                }

                payouts.forEach(p => {
                    const isCorp = p.bankInfo.businessType === 'corporate';
                    const tax = isCorp ? 'なし (法人)' : `¥${Math.floor(p.amount * 0.1021).toLocaleString()} (個人: 10.21%)`;
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${new Date(p.requestDate).toLocaleString()}</td>
                        <td>${p.email}</td>
                        <td style="font-weight:bold; color:#2c3e50;">¥${p.amount.toLocaleString()}</td>
                        <td>${p.bankInfo.invoiceNumber ? `<span style="color:green;">${p.bankInfo.invoiceNumber}</span>` : '<span style="color:#e74c3c;">未登録</span>'}</td>
                        <td>${p.bankInfo.bankName} ${p.bankInfo.branchName}<br>${p.bankInfo.holderName}</td>
                        <td style="color:#e67e22; font-size:0.85rem;">${tax}</td>
                        <td><span style="padding: 4px 8px; border-radius: 4px; background: ${p.status === 'completed' ? '#2ecc71' : '#f1c40f'}; color: #fff; font-size: 0.8rem;">${p.status}</span></td>
                        <td>
                            ${p.status === 'pending' ? `<button class="btn btn-primary" onclick="executePayout('${p.id}', ${p.amount}, '${p.bankInfo.holderName}')">🏦 API送金実行</button>` : '処理済'}
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (e) {
                console.error(e);
            }
        }

        async function executePayout(reqId, amount, name) {
            const confirm = await Swal.fire({
                title: '送金・仕訳の実行',
                html: `クリエイター（${name}）へ <b>¥${amount.toLocaleString()}</b> の出金処理を行います。<br>よろしいですか？<br><br><span style="font-size:0.8rem; color:#666;">※GMOあおぞらネット銀行APIへの振込依頼と、freee会計APIへの仕訳登録が同時に走ります。</span>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '実行する (API起動)'
            });

            if (confirm.isConfirmed) {
                Swal.fire({ title: '処理中...', text: '銀行・会計システムと通信しています', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
                try {
                    const res = await fetch('/api/admin/payout/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reqId })
                    });
                    const data = await res.json();
                    
                    if (res.ok) {
                        Swal.fire('完了！', `銀行への送金指示とfreeeへの仕訳連携が完了しました。<br><br>GMO取引ID: ${data.details.gmo.transferId}<br>freee伝票ID: ${data.details.freee.journalId}`, 'success');
                        loadPayouts();
                    } else {
                        Swal.fire('エラー', data.error || '通信エラー', 'error');
                    }
                } catch (e) {
                    Swal.fire('通信エラー', e.message, 'error');
                }
            }
        }
"""

idx = text.rfind("</script>")
if idx != -1:
    text = text[:idx] + payout_script + "\n" + text[idx:]

# Load payouts initially if we are in admin
load_idx = text.rfind("loadCreations();")
if load_idx != -1:
    text = text[:load_idx] + "loadPayouts();\n                " + text[load_idx:]

with codecs.open('admin_portal.html', 'w', 'utf-8') as f:
    f.write(text)

print("Patched admin_portal.html with Payout dashboard")
