import re

path = r'c:\Users\one\Desktop\RetailMedia_System\admin_portal.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add nav item to sidebar
sidebar_insert_pos = html.find('<div style="margin-top: auto; padding: 20px;">')
nav_html = """
            <div class="nav-section">🚨 コンプライアンス</div>
            <div class="nav-item" id="nav-aml" onclick="switchTab('aml')">
                🚨 AML・不正取引監視
            </div>
"""
if 'switchTab(\'aml\')' not in html:
    html = html[:sidebar_insert_pos] + nav_html + html[sidebar_insert_pos:]

# 2. Add panel
panel_insert_pos = html.find('<!-- CREATOR MANAGEMENT DASHBOARD -->')
panel_html = """
        <!-- AML DASHBOARD -->
        <div id="panel-aml" class="panel">
            <div class="header">
                <div>
                    <h1>🚨 AML・不正取引監視</h1>
                    <p style="color:#7f8c8d; margin-top:5px;">マネーローンダリングおよび不正決済のリアルタイムモニタリング</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="clearAmlLogs()" class="btn-action" style="background:#95a5a6;">🗑️ ログクリア</button>
                    <button onclick="renderAmlLogs()" class="btn-action">🔄 データ更新</button>
                </div>
            </div>

            <div class="card" style="border-left: 4px solid #e74c3c;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin-top:0;">🛑 異常検知アラート (Square連携)</h3>
                    <div style="background:#e74c3c; color:white; padding:5px 10px; border-radius:20px; font-size:12px; font-weight:bold; animation: pulse 1.5s infinite;">● 監視中 (Active)</div>
                </div>
                <p style="font-size:13px; color:#555;">以下の取引は自動検知システムにより「高額決済（5万円以上）」または「異常な連続決済（5分間に5回以上）」と判定されたものです。<br>
                内容を確認し、問題なければ「安全マーク」をつけてください。疑わしい場合はアカウントの停止措置をとります。</p>

                <div style="background:#fff; border:1px solid #ddd; border-radius:8px; overflow-x:auto;">
                    <table>
                        <thead style="background:#f8f9fa;">
                            <tr>
                                <th>検知日時</th>
                                <th>検知タイプ</th>
                                <th>店舗 / ソース</th>
                                <th>決済金額</th>
                                <th>決済内容</th>
                                <th>ステータス</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="aml-table-body">
                            <!-- JS injected -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
"""
if 'id="panel-aml"' not in html:
    html = html[:panel_insert_pos] + panel_html + html[panel_insert_pos:]

# 3. Add script
script_insert_pos = html.rfind('</script>', 0, html.find('</body>'))
script_html = """

        // --- AML Monitoring Logic ---
        let recentTransactions = [];
        
        function renderAmlLogs() {
            const amlLogs = JSON.parse(localStorage.getItem('admin_aml_logs') || '[]');
            const tbody = document.getElementById('aml-table-body');
            if(!tbody) return;
            
            if(amlLogs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">現在、不審な取引は検知されていません。</td></tr>';
                return;
            }

            tbody.innerHTML = amlLogs.map((log, index) => {
                const isSafe = log.status === 'safe';
                const statusBadge = isSafe 
                    ? '<span class="badge badge-sent" style="background:#2ecc71;">安全確認済</span>' 
                    : '<span class="badge badge-unpaid" style="background:#e74c3c; animation: pulse 2s infinite;">要調査🚨</span>';
                
                const typeBadge = log.alertType === 'high_value' 
                    ? '<span style="color:#e67e22; font-weight:bold;">💰 高額決済</span>' 
                    : '<span style="color:#c0392b; font-weight:bold;">⚡ 異常頻度</span>';

                return `
                <tr style="${isSafe ? 'opacity: 0.7;' : 'background:#fff3f3;'}">
                    <td>${log.time}</td>
                    <td>${typeBadge}</td>
                    <td>${log.source}</td>
                    <td style="font-weight:bold; color:#2c3e50;">¥${log.amount.toLocaleString()}</td>
                    <td style="font-size:12px; color:#555;">${log.items}</td>
                    <td>${statusBadge}</td>
                    <td>
                        ${!isSafe ? `<button onclick="markAmlSafe(${index})" class="btn-action" style="background:#2ecc71; padding:5px 10px; font-size:11px;">✅ 安全マーク</button>` : ''}
                    </td>
                </tr>
                `;
            }).join('');
        }

        function markAmlSafe(index) {
            let amlLogs = JSON.parse(localStorage.getItem('admin_aml_logs') || '[]');
            if(amlLogs[index]) {
                amlLogs[index].status = 'safe';
                localStorage.setItem('admin_aml_logs', JSON.stringify(amlLogs));
                renderAmlLogs();
                Swal.fire({ toast: true, position: 'top', title: '安全マークを付けました', icon: 'success', showConfirmButton: false, timer: 1500 });
            }
        }

        function clearAmlLogs() {
            localStorage.removeItem('admin_aml_logs');
            recentTransactions = [];
            renderAmlLogs();
        }

        // Intercept pos logs to run AML rules
        window.addEventListener('storage', (e) => {
            if(e.key === 'admin_pos_log') {
                const logs = JSON.parse(e.newValue || '[]');
                if(logs.length > 0) {
                    const latest = logs[0];
                    checkAmlRules(latest);
                }
            }
        });

        function checkAmlRules(transaction) {
            let amlLogs = JSON.parse(localStorage.getItem('admin_aml_logs') || '[]');
            let alertTriggered = false;
            let alertType = '';

            // Rule 1: High Value ( > 50,000 JPY )
            if(transaction.amount >= 50000) {
                alertTriggered = true;
                alertType = 'high_value';
            }

            // Rule 2: High Frequency ( > 5 times in 5 mins from same source )
            const now = new Date().getTime();
            recentTransactions.push({ ...transaction, timestamp: now });
            
            // Clean old transactions (> 5 mins)
            recentTransactions = recentTransactions.filter(t => (now - t.timestamp) < 5 * 60 * 1000);
            
            // Count from same source
            const sourceCount = recentTransactions.filter(t => t.source === transaction.source).length;
            if(sourceCount >= 5) {
                alertTriggered = true;
                alertType = 'high_frequency';
            }

            if(alertTriggered) {
                // Prevent duplicate exact alerts if same time/amount
                const isDup = amlLogs.some(log => log.time === transaction.time && log.amount === transaction.amount);
                if(!isDup) {
                    amlLogs.unshift({
                        ...transaction,
                        alertType: alertType,
                        status: 'alert'
                    });
                    localStorage.setItem('admin_aml_logs', JSON.stringify(amlLogs));
                    renderAmlLogs();
                    
                    // Show notification if admin is active
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'warning',
                        title: '🚨 AMLシステムが異常な決済を検知しました',
                        showConfirmButton: false,
                        timer: 5000
                    });
                }
            }
        }

        // Make sure render is called when tab is switched or page loaded
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(renderAmlLogs, 800);
        });

"""
if 'checkAmlRules' not in html:
    html = html[:script_insert_pos] + script_html + html[script_insert_pos:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Injected AML successfully.")

