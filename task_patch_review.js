const fs = require('fs');
const pathStr = 'C:/Users/one/Desktop/RetailMedia_System/review.html';
let t = fs.readFileSync(pathStr, 'utf8');

const tableTmpl = `
    <h2 style="margin-top:40px; color:#1e293b; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">🆘 クリエイターアカウントロック解除申請</h2>
    <p style="color:#64748b; font-size:14px;">クリエイターから送信されたAIロック解除の申請です。承認するとアカウントの動画が一括で再配信可能になります。</p>
    <table>
        <thead>
            <tr>
                <th>申請日時</th>
                <th>アカウント</th>
                <th>ステータス</th>
                <th>アクション</th>
            </tr>
        </thead>
        <tbody id="unlock-body">
            <tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">取得中...</td></tr>
        </tbody>
    </table>
`;

const jsTmpl = `
        async function loadUnlockReq() {
            try {
                const res = await fetch('/api/review/unlock');
                const data = await res.json();
                const tbody = document.getElementById('unlock-body');
                tbody.innerHTML = '';
                
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">申請はありません。</td></tr>';
                    return;
                }

                data.reverse().forEach(req => {
                    const row = document.createElement('tr');
                    
                    let badge = '';
                    if (req.status === 'pending') badge = '<span class="bdg-pending">審査待ち</span>';
                    else if (req.status === 'approved') badge = '<span class="bdg-approved">承認済み(復活)</span>';
                    
                    let actions = '';
                    if (req.status === 'pending') {
                        actions = \`<button class="action-btn" style="background:#10b981;" onclick="updateUnlockStatus('\${req.id}')">👍 承認 (ロック解除)</button>\`;
                    } else {
                        actions = '<span style="color:#64748b; font-size:12px;">対応済み</span>';
                    }

                    row.innerHTML = \`
                        <td>\${new Date(req.date || req.id).toLocaleString('ja-JP')}</td>
                        <td style="font-weight:bold;">\${req.creatorId}</td>
                        <td>\${badge}</td>
                        <td>\${actions}</td>
                    \`;
                    tbody.appendChild(row);
                });
            } catch (e) {
                console.error("Lock req fetch error", e);
            }
        }

        async function updateUnlockStatus(id) {
            Swal.fire({
                title: 'アカウントロックを解除しますか？',
                text: "該当クリエイターのすべての動画ステータスが 'active' に復帰します。",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                confirmButtonText: 'はい、解除・復活させる'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const res = await fetch('/api/review/unlock/' + id + '/approve', { method: 'POST' });
                        if (res.ok) {
                            Swal.fire('承認完了', 'アカウントロックを解除しました。', 'success');
                            loadUnlockReq();
                        } else {
                            Swal.fire('エラー', '通信に失敗しました', 'error');
                        }
                    } catch(e) {
                        Swal.fire('エラー', '通信に失敗しました', 'error');
                    }
                }
            });
        }
`;

t = t.replace("</table>", "</table>" + tableTmpl);
t = t.replace("function loadKYCReq() {", jsTmpl + "function loadKYCReq() {");
t = t.replace("loadKYCReq();", "loadKYCReq();\n            loadUnlockReq();");

fs.writeFileSync(pathStr, t);
console.log("Patched review.html");
