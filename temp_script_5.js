
        const API_BASE = location.protocol === 'file:' ? 'http://localhost:3000' : '';

        function switchTab(tabId) {
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            const target = document.getElementById('panel-' + tabId);
            if (target) target.classList.add('active');

            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

            // Map logical ID to visual index
            const map = { 'payout': 0, 'billing': 1, 'creators': 2, 'agency': 3, 'livereg': 4 };
            if (map[tabId] !== undefined) {
                const items = document.querySelectorAll('.nav-item');
                if (items[map[tabId]]) items[map[tabId]].classList.add('active');
            }

            if (tabId === 'agency') loadAgencyData();
            if (tabId === 'creators') loadCreatorData();
            if (tabId === 'livereg') renderLiveLogs();
        }

        async function loadCreatorData() {
            try {
                const res = await fetch(`${API_BASE}/api/admin/creators`);
                const data = await res.json();
                const tbody = document.getElementById('creator-table-body');

                if (data.list && data.list.length > 0) {
                    tbody.innerHTML = data.list.map(c => `
                        <tr>
                            <td><b>${c.name}</b><br><span style="font-size:11px; color:#aaa;">${c.email}</span></td>
                            <td>${c.bank}<br><span style="font-size:11px; color:#aaa;">${c.branch}</span></td>
                            <td>${c.account}</td>
                            <td>¥${c.manufacturer_ad.toLocaleString()}</td>
                            <td style="color:#4285F4;">¥${c.adsense_share.toLocaleString()}</td>
                            <td style="color:#e1b12c;">¥${c.cm_bonus.toLocaleString()}</td>
                            <td style="color:#e74c3c; font-weight:bold;">-¥${c.agency_fee.toLocaleString()}</td>
                            <td class="highlight-value payout-highlight" style="font-size:16px;">¥${c.payout.toLocaleString()}</td>
                            <td><span class="badge badge-unpaid">未払</span></td>
                            <td style="display:flex; gap:5px; flex-direction:column;">
                                <button onclick="sendCreatorEmail('${c.email}', ${c.payout}, this)" class="btn-action send-email-btn" style="background:#9b59b6; font-size:11px;">📩 確定メール</button>
                                <button class="btn-action" style="background:#2ecc71; font-size:11px;">✅ 振込完了</button>
                            </td>
                        </tr>
                    `).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">登録されている口座データはありません</td></tr>';
                }
            } catch (e) { 
                console.error("Creator list failed", e);
                document.getElementById('creator-table-body').innerHTML = '<tr><td colspan="10" style="text-align:center;">データがありません</td></tr>';
            }
        }

        async function sendCreatorEmail(email, amount, btnElement) {
            if (amount <= 0) {
                Swal.fire('情報', '支払額が0円のため送信しません', 'info');
                return;
            }
            try {
                await fetch(`${API_BASE}/api/admin/creators/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: email, amount: amount })
                });

                if (btnElement) {
                    btnElement.innerText = "🚀 送信済!";
                    btnElement.disabled = true;
                    btnElement.style.background = "#27ae60";
                    btnElement.style.cursor = "default";
                }
            } catch (e) {
                console.error("Email send failed", e);
            }
        }

        async function sendAllCreatorEmails() {
            const buttons = document.querySelectorAll('.send-email-btn:not([disabled])');
            let sentCount = 0;

            if (buttons.length === 0) {
                return Swal.fire('情報', '送信可能な確定メールがありません。', 'info');
            }

            // Confirm before bulk action
            const result = await Swal.fire({
                title: '一斉送信の確認',
                text: `${buttons.length}件のクリエイターへ報酬確定メールを送信しますか？`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '送信する',
                cancelButtonText: 'キャンセル'
            });

            if (!result.isConfirmed) return;

            for (let btn of buttons) {
                btn.click();
                sentCount++;
                await new Promise(r => setTimeout(r, 200));
            }

            Swal.fire({
                icon: 'success',
                title: '自動送信完了',
                text: `${sentCount} 件の支払通知メールを自動送信しました。`
            });
        }

        async function verifyAgencyApplication(advertise) {
            if(!confirm(advertise + ' の申請を承認(Verify)しますか？')) return;
            try {
                const res = await fetch('/api/admin/agency-verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ advertise })
                });
                const data = await res.json();
                if (data.success) {
                    loadAgencyData();
                } else {
                    alert('エラー: ' + data.error);
                }
            } catch(e) {
                console.error(e);
                alert('通信エラーが発生しました');
            }
        }

        async function loadAgencyData() {
            try {
                const res = await fetch(`${API_BASE}/api/admin/agency`);
                const referrals = await res.json();

                const tbody = document.getElementById('agency-table-body');
                if (tbody) {
                    tbody.innerHTML = [...referrals].reverse().map(r => `
                        <tr>
                            <td>${r.date}</td>
                            <td>${r.agency}</td>
                            <td>${r.advertise}<br><span style="font-size:11px;color:#7f8c8d;">${r.advContact || '未登録'} / ${r.advPhone || '未登録'}</span></td>
                            <td>¥${r.price.toLocaleString()}</td>
                            <td style="color:#e67e22; font-weight:bold;">¥${Math.floor(r.price * 0.2).toLocaleString()}</td>
                            <td>
                            ${r.status === 'Pending' ? 
                                `<span class="badge badge-pending" style="cursor:pointer;" onclick="verifyAgencyApplication('${r.advertise}')">${r.status}</span>` : 
                                `<span class="badge badge-active" style="background:rgba(46, 204, 113, 0.2); color:#2ecc71;">${r.status}</span>`
                            }
                        </td>
                        </tr>
                    `).join('');
                }
            } catch (e) {
                console.error("Error loading agency data", e);
                const tbody = document.getElementById('agency-table-body');
                if(tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">データがありません</td></tr>';
            }
        }

        async function loadData() {
            try {
                const res = await fetch(`${API_BASE}/api/admin/dashboard`);
                const data = await res.json();

                if (data.accounting_email) {
                    document.getElementById('admin-email').value = data.accounting_email;
                }

                // Render Billing Table
                const billingRows = data.billing.map(store => `
                < tr >
                    <td><b>${store.name}</b><br><span style="font-size:11px; color:#aaa;">${store.id}</span></td>
                    <td>¥${store.sales.toLocaleString()}</td>
                    <td><span class="badge badge-pending">1.2%</span></td>
                    <td class="highlight-value billing-highlight">¥${store.fee_1_2_percent.toLocaleString()}</td>
                    <td>${store.email || '<span style="color:red">未設定</span>'}</td>
                    <td><span class="badge badge-pending">${store.status}</span></td>
                    <td>
                        <button onclick="sendInvoice('${store.email}', ${store.fee_1_2_percent}, this)" class="btn-action" ${!store.email ? 'disabled' : ''}>📧 請求書送信</button>
                    </td>
                </tr >
                `).join('');
                document.getElementById('billing-table-body').innerHTML = billingRows;

                // Render Payout Table
                const payoutRows = data.payouts.map(store => `
                < tr >
                    <td><b>${store.name}</b><br><span style="font-size:11px; color:#aaa;">ID: ${store.id}</span></td>
                    <td>¥${store.retail_ad_revenue.toLocaleString()}</td>
                    <td style="color:#4285F4; font-weight:bold;">¥${store.adsense_revenue.toLocaleString()}</td>
                    <td style="color:#e67e22;">-¥${store.agency_commission.toLocaleString()}</td>
                    <td style="color:#e74c3c;">-¥${store.creator_reward.toLocaleString()}</td>
                    <td style="color:#e74c3c;">-¥${store.operating_cost.toLocaleString()}</td>
                    <td style="font-weight:bold; background:rgba(0,0,0,0.02);">¥${store.total_net_revenue.toLocaleString()}</td>
                    <td class="highlight-value payout-highlight" style="font-size:16px;">¥${store.ad_revenue_share.toLocaleString()}</td>
                    <td>
                        <button onclick="viewBankInfo('${escape(JSON.stringify(store.bank_info))}')" class="btn-view">🏦 銀行情報確認</button>
                    </td>
                    <td><span class="badge badge-unpaid">${store.status}</span></td>
                    <td style="display:flex; flex-direction:column; gap:5px;">
                        <button onclick="sendPayoutEmail('${store.email}', ${store.ad_revenue_share}, this)" class="btn-action payout-email-btn" style="background:#8e44ad; font-size:11px;">📩 確定メール</button>
                        <button onclick="markAsPaid('${store.id}', this)" class="btn-action" style="background:#2ecc71; font-size:11px;">✅ 振込完了</button>
                    </td>
                </tr >
                `).join('');
                document.getElementById('payout-table-body').innerHTML = payoutRows;

            } catch (e) {
                console.error("Failed to load admin data", e);
                document.getElementById('admin-email').value = "admin@retail-ad.com";
                
                document.getElementById('billing-table-body').innerHTML = '<tr><td colspan="7" style="text-align:center;">データがありません</td></tr>';

                document.getElementById('payout-table-body').innerHTML = '<tr><td colspan="11" style="text-align:center;">データがありません</td></tr>';
            }
        }

        async function validateSquareData() {
            try {
                // Show loading
                Swal.fire({
                    title: '整合性の確認中...',
                    text: 'Square APIを通じて実処理金額とローカルデータ(SSoT)を照合しています',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const res = await fetch(`${API_BASE}/api/admin/system/validate-square`);
                const result = await res.json();

                if (result.success && result.isMatch) {
                    Swal.fire({
                        icon: 'success',
                        title: '整合性チェック合格',
                        html: `
                        <div style="text-align:left; font-size:14px; background:#f8fafc; padding:15px; border-radius:8px;">
                            <p>✅ SSoTデータとSquare集計値は完全に一致しています。</p>
                            <p><b>ローカルリテアド収益:</b> ¥${result.localAdAmount.toLocaleString()}</p>
                            <p><b>Square API 実績(Ad):</b> ¥${result.squareAdAmount.toLocaleString()}</p>
                            <hr style="border:0; border-top:1px solid #e2e8f0; margin:10px 0;">
                            <p><b>ローカルレジ売上(POS):</b> ¥${result.localPosAmount.toLocaleString()}</p>
                            <p><b>Square API 実績(POS):</b> ¥${result.squarePosAmount.toLocaleString()}</p>
                        </div>
                        `
                    });
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: '不一致を検知しました',
                        text: '連携エラーや未処理の決済データが存在する可能性があります。ログを確認してください。'
                    });
                }
            } catch (e) {
                Swal.fire('通信エラー', 'Square API との通信に失敗しました', 'error');
            }
        }

        async function sendPayoutEmail(email, amount, btnElement) {
            try {
                // Mock endpoint, same logic as Creator/Billing
                await fetch(`${API_BASE}/api/admin/creators/send-email`, { // Reusing mock email endpoint
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: email, amount: amount, type: 'store_payout' })
                });

                if (btnElement) {
                    btnElement.innerText = "🚀 送信済";
                    btnElement.disabled = true;
                    btnElement.style.background = "#27ae60";
                    btnElement.style.cursor = "default";
                }
            } catch (e) {
                console.error("Payout Email send failed", e);
            }
        }

        async function sendAllPayoutEmails() {
            const buttons = document.querySelectorAll('.payout-email-btn:not([disabled])');
            let sentCount = 0;

            if (buttons.length === 0) {
                return Swal.fire('情報', '送信可能な確定メールがありません。', 'info');
            }

            const result = await Swal.fire({
                title: '一斉送信の確認',
                text: `${buttons.length}件の店舗へ「広告収益・AdSense収益支払通知メール」を送信しますか？`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '送信する',
                cancelButtonText: 'キャンセル'
            });

            if (!result.isConfirmed) return;

            for (let btn of buttons) {
                btn.click();
                sentCount++;
                await new Promise(r => setTimeout(r, 200));
            }

            Swal.fire({
                icon: 'success',
                title: '自動送信完了',
                text: `${sentCount} 件の支払通知メールを各店舗に自動送信しました。`
            });
        }

        async function saveAdminSettings() {
            const email = document.getElementById('admin-email').value;
            if (!email) return Swal.fire('エラー', 'メールアドレスを入力してください', 'error');

            await fetch(`${API_BASE}/api/admin/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accounting_email: email })
            });
            Swal.fire('保存', '担当経理メールアドレスを更新しました。', 'success');
        }

        async function sendInvoice(storeEmail, amount, btnElement) {
            const senderEmail = document.getElementById('admin-email').value || "system@default.com";

            // No Confirm - Automatic Send with PDF content
            try {
                await fetch(`${API_BASE}/api/admin/billing/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: storeEmail, from: senderEmail, amount: amount })
                });

                // Visual Feedback
                if (btnElement) {
                    btnElement.innerText = "🚀 送信済!";
                    btnElement.disabled = true;
                    btnElement.style.background = "#27ae60";
                    btnElement.style.cursor = "default";
                }
            } catch (e) {
                console.error("Send failed", e);
            }
        }

        async function sendAllInvoices() {
            const buttons = document.querySelectorAll('#billing-table-body button');
            let sentCount = 0;

            for (let btn of buttons) {
                if (!btn.disabled) {
                    btn.click();
                    sentCount++;
                    await new Promise(r => setTimeout(r, 200)); // Small delay for effect
                }
            }

            if (sentCount > 0) {
                Swal.fire({
                    icon: 'success',
                    title: '自動送信完了',
                    text: `${sentCount} 件の請求書を自動送信しました。`
                });
            } else {
                Swal.fire('情報', '送信可能な請求書がありませんでした。', 'info');
            }
        }

        function viewBankInfo(jsonStr) {
            const info = JSON.parse(unescape(jsonStr));
            Swal.fire({
                title: '銀行口座情報',
                html: `
            < div style = "text-align:left; font-size:14px;" >
                    <p><b>銀行名:</b> ${info.bank_name || '--'}</p>
                    <p><b>支店名:</b> ${info.branch_name || '--'}</p>
                    <p><b>口座番号:</b> ${info.account_number || '--'}</p>
                    <p><b>名義:</b> ${info.account_holder || '--'}</p>
                </div >
                `,
                icon: 'info'
            });
        }

        function escape(str) {
            return str.replace(/'/g, "\\'");
        }

        // Initial Load - Removed, moved to after login
        // loadData();

        // --- Login Logic ---
        async function handleLogin() {
            const user = document.getElementById('admin-user').value;
            const pass = document.getElementById('admin-pass').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user, password: pass, role: 'admin' })
                });
                const data = await response.json();
                
                if (data.require2FASetup) {
                    const qrRes = await fetch('/api/auth/2fa/setup', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email: user})});
                    const qrData = await qrRes.json();
                    const code = await Swal.fire({
                        title: '二重認証の初期設定',
                        html: `<p>Google Authenticator等のアプリでQRコードを読み込み、表示された6桁のコードを入力してください。</p><img src="${qrData.qrcode}" style="margin: 10px auto;"><br><input type="text" id="totpCodeInput" class="swal2-input" placeholder="6桁のコード" autocomplete="off">`,
                        preConfirm: () => document.getElementById('totpCodeInput').value,
                        showCancelButton: true
                    });
                    if (code.value) {
                        const vRes = await fetch('/api/auth/2fa/enable', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email: user, token: code.value, secret: qrData.secret})});
                        const vData = await vRes.json();
                        if(vData.success) {
                            Swal.fire('完了', '二重認証が設定されました。再度ログインしてください。', 'success');
                        } else {
                            Swal.fire('エラー', 'コードが違います。もう一度やり直してください。', 'error');
                        }
                    }
                    return;
                }

                if (data.require2FA) {
                    const code = await Swal.fire({
                        title: '二重認証',
                        text: '認証アプリに表示されている6桁のコードを入力してください',
                        input: 'text',
                        inputPlaceholder: '000000',
                        showCancelButton: true
                    });
                    if (code.value) {
                        const response2 = await fetch('/api/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: user, password: pass, role: 'admin', totpCode: code.value })
                        });
                        const data2 = await response2.json();
                        if (data2.success) {
                            sessionStorage.setItem('retailMediaAuth', 'true');
                            document.getElementById('login-overlay').style.display = 'none';
                            document.getElementById('main-app').style.display = 'flex';
                            window.dispatchEvent(new Event('resize'));
                            loadData();
                        } else {
                            Swal.fire('エラー', data2.error || '無効なコードです', 'error');
                        }
                    }
                    return;
                }

                if (data.success) {
                    sessionStorage.setItem('retailMediaAuth', 'true');
                    document.getElementById('login-overlay').style.display = 'none';
                    document.getElementById('main-app').style.display = 'flex';
                    window.dispatchEvent(new Event('resize'));
                    loadData();
                } else {
                    Swal.fire('Error', data.error || 'Invalid Admin Credentials', 'error');
                }
            } catch(e) {
                Swal.fire('Error', e.message || 'Server Connection Failed', 'error');
            }
        }

        function switchLoginTab(mode) {
            const loginForm = document.getElementById('form-login');
            const signupForm = document.getElementById('form-signup');
            const tabLogin = document.getElementById('tab-login');
            const tabSignup = document.getElementById('tab-signup');

            if (mode === 'login') {
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
                tabLogin.style.borderBottom = '2px solid #3498db';
                tabLogin.style.fontWeight = 'bold';
                tabLogin.style.color = '#2c3e50';
                tabSignup.style.borderBottom = 'none';
                tabSignup.style.fontWeight = 'normal';
                tabSignup.style.color = '#95a5a6';
            } else {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
                tabSignup.style.borderBottom = '2px solid #27ae60';
                tabSignup.style.fontWeight = 'bold';
                tabSignup.style.color = '#2c3e50';
                tabLogin.style.borderBottom = 'none';
                tabLogin.style.fontWeight = 'normal';
                tabLogin.style.color = '#95a5a6';
            }
        }

        async function handleRegister() {
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-pass').value;

            if (!email || !pass) return Swal.fire('Error', 'Please fill all fields', 'warning');

            // Set to login fields so handleLogin can process 2FA setup correctly
            document.getElementById('admin-user').value = email;
            document.getElementById('admin-pass').value = pass;
            
            // Auto-login which will trigger account creation and 2FA setup
            handleLogin();
        }

        function logoutAdmin() {
            sessionStorage.removeItem('retailMediaAuth');
            document.getElementById('main-app').style.display = 'none';
            document.getElementById('login-overlay').style.display = 'flex';
            document.getElementById('admin-user').value = '';
            document.getElementById('admin-pass').value = '';
            Swal.fire({ toast: true, position: 'top', title: 'ログアウトしました', icon: 'info', showConfirmButton: false, timer: 1500 });
        }

        // Accessibility Fix: Ensure login overlay is not hidden from screen readers
        document.addEventListener('DOMContentLoaded', () => {
            const overlay = document.getElementById('login-overlay');
            if (overlay) overlay.removeAttribute('aria-hidden');
            setTimeout(() => { renderLiveLogs(); }, 500);
        });

        // --- Live POS Monitor logic ---
        function renderLiveLogs() {
            const localLog = JSON.parse(localStorage.getItem('admin_pos_log') || '[]');
            const tbody = document.getElementById('live-pos-table');
            if(!tbody) return;
            
            if(localLog.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">まだ受信したトランザクションがありません。別タブでどこでもレジを開いて購入をテストしてください。</td></tr>';
                return;
            }

            tbody.innerHTML = localLog.map(log => {
                const isRealTime = log.type === 'LIVE_SALE';
                const sourceColor = isRealTime ? '#10b981' : '#3b82f6';
                const matchStatus = isRealTime 
                    ? `<span style="color:#a855f7; font-weight:bold;">動画検証中... (照合完了予定 月末)</span>` 
                    : `<span style="color:#64748b;">定期同期 (通常処理)</span>`;

                return `
                <tr class="log-row" style="border-bottom:1px solid #334155;">
                    <td style="padding:10px; font-weight:bold; color:#cbd5e1;">${log.time}</td>
                    <td style="padding:10px; color:${sourceColor};">${log.source}</td>
                    <td style="padding:10px; color:#f8fafc; font-weight:bold; font-size:14px;">¥${log.amount.toLocaleString()}</td>
                    <td style="padding:10px; color:#94a3b8;"><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${log.items}</div></td>
                    <td style="padding:10px;">${matchStatus}</td>
                </tr>
                `;
            }).join('');
        }

        // Listen for real-time checkout events happening in adjacent tabs
        window.addEventListener('storage', (e) => {
            if(e.key === 'admin_pos_log') {
                renderLiveLogs();
            }
        });
    