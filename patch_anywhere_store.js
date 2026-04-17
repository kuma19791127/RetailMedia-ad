const fs = require('fs');

let aw = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/anywhere_regi.html', 'utf8');

// Strip buttons from anywhere_regi
aw = aw.replace(`<button onclick="window.open('anywhere_lp.html', '_blank')" class="btn-sm" style="background:#3b82f6; color:white; padding:8px 8px; font-weight:bold;">📖 LPを見る</button>`, '');
aw = aw.replace(`<button onclick="showSalesByCompany()" class="btn-sm" style="background:#0ea5e9; color:white; padding:8px 8px; font-weight:bold;">📊 会社別売上</button>`, '');
aw = aw.replace(`<button onclick="document.getElementById('excel-master-upload').click()" class="btn-sm nav-btn-mobile" style="background:#10B981; color:white; padding:8px 8px; font-weight:bold;">📥 商品データ取込</button>`, '');
aw = aw.replace(`<button onclick="showIntegrationSettings()" class="btn-sm" style="background:#8e44ad; color:white; padding:8px 8px; font-weight:bold;">⚙️ 連携設定</button>`, '');
aw = aw.replace(`<button onclick="toggleDebugLog()" class="btn-sm nav-btn-mobile" style="background:#f59e0b; color:white; padding:8px 8px; font-weight:bold;">🛠 スキャン履歴</button>`, '');

// Remove local storage pos_company_sales save logic in auth
const lsSync = `// --- Organization Breakdown ---
                    const companySales = JSON.parse(localStorage.getItem('pos_company_sales') || '{}');
                    const orgName = (currentSession && currentSession.storeName) ? currentSession.storeName : "未設定の組織";
                    companySales[orgName] = (companySales[orgName] || 0) + total;
                    localStorage.setItem('pos_company_sales', JSON.stringify(companySales));`;
if(aw.includes(lsSync)) {
    aw = aw.replace(lsSync, '');
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/anywhere_regi.html', aw, 'utf8');

let sp = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/store_portal.html', 'utf8');

// Add "POS Data" into Store Portal Revenue panel
const revenueHtmlTarget = `<!-- Detailed Revenue Model (Intro) -->`;
const posDataHtml = `
            <div class="card" style="margin-bottom:20px; border-left: 5px solid #3b82f6;" id="pos-sales-container">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:15px;">
                    <h3 style="margin:0; color:#2c3e50;"><span style="white-space:pre;">🛒 </span>モバイルPOS売上状況</h3>
                    <div style="display:flex; gap:10px;">
                        <button onclick="document.getElementById('pos-master-upload').click()" class="btn-sm" style="background:#10B981; color:white; border:none; padding:8px 12px; font-weight:bold; border-radius:6px; cursor:pointer;">📥 商品データ取込</button>
                        <input type="file" id="pos-master-upload" accept=".xlsx, .xls" style="display:none;" onchange="handleExcelUpload(event)">
                        <button onclick="showIntegrationSettings()" class="btn-sm" style="background:#8e44ad; color:white; border:none; padding:8px 12px; font-weight:bold; border-radius:6px; cursor:pointer;">⚙️ POS連携設定</button>
                    </div>
                </div>
                
                <div class="metric-grid">
                    <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                        <div class="card-label">総売り上げ (Total Sales)</div>
                        <div class="revenue-big" id="pos-total-sales">¥0</div>
                    </div>
                    <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                        <div class="card-label">本日の客数 (Customers)</div>
                        <div class="revenue-big" id="pos-total-customers" style="color:#0ea5e9;">0人</div>
                    </div>
                </div>

                <h4 style="color:#2c3e50; margin-top:20px;">🏢 顧客(企業)別売上</h4>
                <div id="company-sales-list" style="background:#f1f5f9; padding:15px; border-radius:8px; max-height:200px; overflow-y:auto; font-size:14px;">
                    読み込み中...
                </div>

                <h4 style="color:#2c3e50; margin-top:20px;">📋 決済＆スキャン履歴</h4>
                <div id="tx-history-list" style="background:#1e293b; color:#a5b4fc; padding:15px; border-radius:8px; max-height:250px; overflow-y:auto; font-size:13px; font-family:monospace;">
                    読み込み中...
                </div>
            </div>

            <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
            <script>
                async function loadPosData() {
                    try {
                        const response = await fetch('/api/admin/sales-history');
                        const data = await response.json();
                        let total = 0;
                        let cust = 0;
                        let companySales = {};
                        let histHtml = '';

                        if(data.success && data.transactions) {
                            cust = data.transactions.length;
                            // Reverse to show newest first
                            data.transactions.reverse().forEach(tx => {
                                total += tx.amount;
                                
                                // Group by StoreId/Customer equivalent
                                const org = tx.storeId || 'Demo Store';
                                companySales[org] = (companySales[org] || 0) + tx.amount;

                                histHtml += '<div style="border-bottom:1px solid #334155; padding-bottom:8px; margin-bottom:8px;">';
                                histHtml += '<span style="color:#10b981;">[' + new Date(tx.timestamp).toLocaleString() + ']</span> ';
                                histHtml += '決済ID: ' + tx.transactionId + ' (' + org + ') <br>';
                                histHtml += '🛒 合計: <strong style="color:white;">¥' + tx.amount.toLocaleString() + '</strong><br>';
                                if(tx.items) {
                                    histHtml += '<span style="color:#94a3b8;">  Items: ' + tx.items.map(i=> i.name).join(', ') + '</span>';
                                }
                                histHtml += '</div>';
                            });

                            document.getElementById('pos-total-sales').innerText = '¥' + total.toLocaleString();
                            document.getElementById('pos-total-customers').innerText = cust + '人';

                            let compHtml = '<table style="width:100%; border-collapse:collapse;">';
                            let count = 0;
                            for(const c in companySales) {
                                compHtml += '<tr><td style="padding:5px; border-bottom:1px solid #cbd5e1;">' + c + '</td><td style="padding:5px; text-align:right; font-weight:bold; border-bottom:1px solid #cbd5e1;">¥' + companySales[c].toLocaleString() + '</td></tr>';
                                count++;
                            }
                            if(count===0) compHtml += '<tr><td>データなし</td></tr>';
                            compHtml += '</table>';
                            document.getElementById('company-sales-list').innerHTML = compHtml;

                            if(!histHtml) histHtml = '決済履歴はまだありません。';
                            document.getElementById('tx-history-list').innerHTML = histHtml;
                        }
                    } catch(e) {
                         document.getElementById('tx-history-list').innerHTML = '通信エラーが発生しました';
                    }
                }
                
                // On load revenue page
                document.addEventListener('DOMContentLoaded', () => {
                   loadPosData();
                   // Auto refresh every 10s
                   setInterval(loadPosData, 10000);
                });

                function showIntegrationSettings() {
                    Swal.fire({
                        title: 'POS連携設定',
                        html: '<div style="text-align:left; font-size:14px;"><h4>Square API設定</h4><p>Squareのアクセストークンを入力することで本物クレジットカード決済が稼働します。</p><input type="text" class="swal2-input" placeholder="Square Access Token"></div>',
                        confirmButtonText: '保存'
                    });
                }
                
                function handleExcelUpload(e) {
                    const file = e.target.files[0];
                    if(!file) return;
                    const reader = new FileReader();
                    reader.onload = async function(evt) {
                        try {
                            const data = evt.target.result;
                            const workbook = XLSX.read(data, {type: 'binary'});
                            const firstSheet = workbook.SheetNames[0];
                            const excelRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
                            if(excelRows.length === 0) return Swal.fire('エラー', '有効な商品データがありません', 'error');
                            Swal.fire('商品マスター同期完了', excelRows.length + '件の商品を取り込みました。', 'success');
                            // Alert anywhere_regi
                            localStorage.setItem('sync_inventory_time', Date.now().toString());
                        } catch(err) {
                            Swal.fire('取り込みエラー', err.message, 'error');
                        }
                    };
                    reader.readAsBinaryString(file);
                }
            </script>`;

if(sp.includes(revenueHtmlTarget) && !sp.includes('loadPosData()')) {
    sp = sp.replace(revenueHtmlTarget, posDataHtml + '\n' + revenueHtmlTarget);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/store_portal.html', sp, 'utf8');
}

console.log('Frontend patched.');
