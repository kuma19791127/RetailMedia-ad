import os

file_path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\review.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to LF
original_ending = "\r\n" if "\r\n" in content else "\n"
content_lf = content.replace("\r\n", "\n")

# Definition 1: loadUnlockReq & updateUnlockStatus
target_1 = """        async function loadUnlockReq() {
            try {
                const res = await fetch(window.API_BASE_URL + '/api/review/unlock');
                const data = await res.json();
                const tbody = document.getElementById('unlock-body');
                tbody.innerHTML = '';
                
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">申請はありません。</td></tr>';
                    return;
                }

                data.reverse().forEach(req => {
                    const row = document.createElement('tr');
                    
                    let badge = '';
                    if (req.status === 'pending') badge = '<span class="bdg-pending">審査待ち</span>';
                    else if (req.status === 'approved') badge = '<span class="bdg-approved">承認済み(復活)</span>';
                    
                    let actions = '';
                    if (req.status === 'pending') {
                        actions = `<button class="action-btn" style="background:#10b981;" onclick="updateUnlockStatus('${req.id}')">👍 承認 (ロック解除)</button>`;
                    } else {
                        actions = '<span style="color:#64748b; font-size:12px;">対応済み</span>';
                    }

                    row.innerHTML = `
                        <td>${new Date(req.date || req.id).toLocaleString('ja-JP')}</td>
                        <td>
                            <b>${req.creatorId}</b><br>
                            <span style="font-size:11px;color:#64748b;">申し開き: ${req.appealText || '特になし'}</span><br>
                            <span style="font-size:11px;color:${req.aiRiskScore > 70 ? '#ef4444' : '#10b981'}; font-weight:bold;">
                                🤖 AI同一人物リスク: ${req.aiRiskScore || 0}%<br>
                                (${req.aiReason || 'チェック完了'})
                            </span>
                        </td>
                        <td>
                            ${req.proofUrl ? '<a href="' + req.proofUrl + '" target="_blank" style="display:inline-block; border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; width:50px; height:50px;"><img src="' + req.proofUrl + '" style="width:100%; height:100%; object-fit:cover;"></a>' : '<span style="color:#94a3b8; font-size:11px;">証拠提出なし</span>'}
                        </td>
                        <td>${badge}</td>
                        <td>${actions}</td>
                    `;
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
                        const res = await fetch(window.API_BASE_URL + '/api/review/unlock/' + id + '/approve', { method: 'POST' });
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
        }"""

replacement_1 = """        async function loadUnlockReq() {
            console.log("[F12 Debug] loadUnlockReq initiated");
            try {
                console.log("[F12 Debug] Fetching unlock requests from:", window.API_BASE_URL + '/api/review/unlock');
                const res = await fetch(window.API_BASE_URL + '/api/review/unlock');
                console.log("[F12 Debug] loadUnlockReq fetch status:", res.status);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                console.log("[F12 Debug] loadUnlockReq fetched data count:", data.length);
                const tbody = document.getElementById('unlock-body');
                tbody.innerHTML = '';
                
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">申請はありません。</td></tr>';
                    return;
                }

                data.reverse().forEach(req => {
                    const row = document.createElement('tr');
                    
                    let badge = '';
                    if (req.status === 'pending') badge = '<span class="bdg-pending">審査待ち</span>';
                    else if (req.status === 'approved') badge = '<span class="bdg-approved">承認済み(復活)</span>';
                    
                    let actions = '';
                    if (req.status === 'pending') {
                        actions = `<button class="action-btn" style="background:#10b981;" onclick="updateUnlockStatus('${req.id}')">👍 承認 (ロック解除)</button>`;
                    } else {
                        actions = '<span style="color:#64748b; font-size:12px;">対応済み</span>';
                    }

                    row.innerHTML = `
                        <td>${new Date(req.date || req.id).toLocaleString('ja-JP')}</td>
                        <td>
                            <b>${req.creatorId}</b><br>
                            <span style="font-size:11px;color:#64748b;">申し開き: ${req.appealText || '特になし'}</span><br>
                            <span style="font-size:11px;color:${req.aiRiskScore > 70 ? '#ef4444' : '#10b981'}; font-weight:bold;">
                                🤖 AI同一人物リスク: ${req.aiRiskScore || 0}%<br>
                                (${req.aiReason || 'チェック完了'})
                            </span>
                        </td>
                        <td>
                            ${req.proofUrl ? '<a href="' + req.proofUrl + '" target="_blank" style="display:inline-block; border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; width:50px; height:50px;"><img src="' + req.proofUrl + '" style="width:100%; height:100%; object-fit:cover;"></a>' : '<span style="color:#94a3b8; font-size:11px;">証拠提出なし</span>'}
                        </td>
                        <td>${badge}</td>
                        <td>${actions}</td>
                    `;
                    tbody.appendChild(row);
                });
            } catch (e) {
                console.error("[F12 Debug] Lock req fetch error", e);
                document.getElementById('unlock-body').innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#ef4444;">ロック解除申請の取得中に通信エラーが発生しました: ${e.message}</td></tr>`;
            }
        }

        async function updateUnlockStatus(id) {
            console.log("[F12 Debug] updateUnlockStatus requested for ID:", id);
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
                        console.log("[F12 Debug] Sending unlock approval request for ID:", id);
                        const res = await fetch(window.API_BASE_URL + '/api/review/unlock/' + id + '/approve', { method: 'POST' });
                        console.log("[F12 Debug] updateUnlockStatus response status:", res.status);
                        if (!res.ok) {
                            throw new Error(`HTTP error! status: ${res.status}`);
                        }
                        const data = await res.json();
                        console.log("[F12 Debug] updateUnlockStatus response data:", data);
                        if (data.success) {
                            Swal.fire('承認完了', 'アカウントロックを解除しました。', 'success');
                            loadUnlockReq();
                        } else {
                            throw new Error(data.error || "ロック解除処理に失敗しました。");
                        }
                    } catch(e) {
                        console.error("[F12 Debug] updateUnlockStatus error:", e);
                        Swal.fire('エラー', '通信に失敗しました: ' + e.message, 'error');
                    }
                }
            });
        }"""

# Definition 2: loadKYCReq & updateKyc
target_2 = """async function loadKYCReq() {
        try {
            const res = await fetch(window.API_BASE_URL + '/api/kyc');
            const data = await res.json();
            const tbody = document.getElementById('kyc-history-body');
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">現在、審査待ちのKYC書類はありません。</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            // 新しい順に表示
            data.reverse().forEach(req => {
                const tr = document.createElement('tr');
                const dt = new Date(req.createdAt).toLocaleString('ja-JP');
                
                let statusBdg = '';
                if(req.status === 'pending') statusBdg = '<span class="bdg-pending">審査待ち</span>';
                else if(req.status === 'approved') statusBdg = '<span class="bdg-approved">承認済み</span>';
                else statusBdg = '<span class="bdg-rejected">却下</span>';

                let actionBtns = '';
                if(req.status === 'pending') {
                    actionBtns = `
                        <button class="action-btn btn-approve" onclick="updateKyc('${req.id}', 'approved')">承認</button>
                        <button class="action-btn btn-reject" onclick="updateKyc('${req.id}', 'rejected')">却下</button>
                    `;
                } else {
                    actionBtns = '<span style="color:#94a3b8; font-size:12px; font-weight:bold;">処理済み</span>';
                }

                tr.innerHTML = `
                    <td>${dt}</td>
                    <td><b>${req.userEmail}</b></td>
                    <td style="font-size:12px; line-height:1.6;">
                        <span style="color:#64748b;">法人番号:</span> <b>${req.corpId}</b> <br>
                        <span style="color:#64748b;">DUNS:</span> <b>${req.duns || '未入力'}</b> <br>
                        <a href="https://www.houjin-bangou.nta.go.jp/houjin/v1/search?corpNumber=${req.corpId}" target="_blank" style="color:#3b82f6; text-decoration:none; font-weight:bold;">🔍 国税庁DBワンクリック照合</a> <br>
                        <span style="color:#10b981;">✅ AI画像解析: パス済み</span>
                    </td>
                    <td>${statusBdg}</td>
                    <td>${actionBtns}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) {
            document.getElementById('kyc-history-body').innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#ef4444;">APIサーバーとの通信エラー</td></tr>';
        }
    }

    async function updateKyc(id, status) {
        try {
            const res = await fetch(window.API_BASE_URL + '/api/kyc/' + id + '/status', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({status})
            });
            if(res.ok) {
                Swal.fire({toast:true, position:'top-end', icon:'success', title:'ステータスを更新しました', showConfirmButton:false, timer:2000});
                loadKYCReq();
            loadUnlockReq();
            }
        } catch(e) {}
    }"""

replacement_2 = """async function loadKYCReq() {
        console.log("[F12 Debug] loadKYCReq initiated");
        try {
            console.log("[F12 Debug] Fetching KYC requests from:", window.API_BASE_URL + '/api/kyc');
            const res = await fetch(window.API_BASE_URL + '/api/kyc');
            console.log("[F12 Debug] loadKYCReq fetch status:", res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            console.log("[F12 Debug] loadKYCReq fetched data count:", data.length);
            const tbody = document.getElementById('kyc-history-body');
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">現在、審査待ちのKYC書類はありません。</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            // 新しい順に表示
            data.reverse().forEach(req => {
                const tr = document.createElement('tr');
                const dt = new Date(req.createdAt).toLocaleString('ja-JP');
                
                let statusBdg = '';
                if(req.status === 'pending') statusBdg = '<span class="bdg-pending">審査待ち</span>';
                else if(req.status === 'approved') statusBdg = '<span class="bdg-approved">承認済み</span>';
                else statusBdg = '<span class="bdg-rejected">却下</span>';

                let actionBtns = '';
                if(req.status === 'pending') {
                    actionBtns = `
                        <button class="action-btn btn-approve" onclick="updateKyc('${req.id}', 'approved')">承認</button>
                        <button class="action-btn btn-reject" onclick="updateKyc('${req.id}', 'rejected')">却下</button>
                    `;
                } else {
                    actionBtns = '<span style="color:#94a3b8; font-size:12px; font-weight:bold;">処理済み</span>';
                }

                tr.innerHTML = `
                    <td>${dt}</td>
                    <td><b>${req.userEmail}</b></td>
                    <td style="font-size:12px; line-height:1.6;">
                        <span style="color:#64748b;">法人番号:</span> <b>${req.corpId}</b> <br>
                        <span style="color:#64748b;">DUNS:</span> <b>${req.duns || '未入力'}</b> <br>
                        <a href="https://www.houjin-bangou.nta.go.jp/houjin/v1/search?corpNumber=${req.corpId}" target="_blank" style="color:#3b82f6; text-decoration:none; font-weight:bold;">🔍 国税庁DBワンクリック照合</a> <br>
                        <span style="color:#10b981;">✅ AI画像解析: パス済み</span>
                    </td>
                    <td>${statusBdg}</td>
                    <td>${actionBtns}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) {
            console.error("[F12 Debug] loadKYCReq error:", e);
            document.getElementById('kyc-history-body').innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#ef4444;">APIサーバーとの通信エラー: ${e.message}</td></tr>`;
        }
    }

    async function updateKyc(id, status) {
        console.log("[F12 Debug] updateKyc requested for ID:", id, "Status:", status);
        try {
            console.log("[F12 Debug] Sending KYC status update to:", window.API_BASE_URL + '/api/kyc/' + id + '/status');
            const res = await fetch(window.API_BASE_URL + '/api/kyc/' + id + '/status', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({status})
            });
            console.log("[F12 Debug] updateKyc response status:", res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            console.log("[F12 Debug] updateKyc response data:", data);
            if (data.success) {
                Swal.fire({toast:true, position:'top-end', icon:'success', title:'ステータスを更新しました', showConfirmButton:false, timer:2000});
                loadKYCReq();
                loadUnlockReq();
            } else {
                throw new Error(data.error || "ステータス更新処理に失敗しました。");
            }
        } catch(e) {
            console.error("[F12 Debug] updateKyc error:", e);
            Swal.fire('エラー', '審査状況の更新に失敗しました: ' + e.message, 'error');
        }
    }"""

# Definition 3: Load listeners
target_3 = """    // Load on start
    window.addEventListener('load', loadKYCReq);
    // Auto refresh every 5 seconds
    setInterval(loadKYCReq, 5000);"""

replacement_3 = """    // Load on start
    window.addEventListener('load', () => {
        loadKYCReq();
        loadUnlockReq();
    });
    // Auto refresh every 5 seconds
    setInterval(() => {
        loadKYCReq();
        loadUnlockReq();
    }, 5000);"""

# Definition 4: handleLogin fetch block and catch block
fetch_part_old = """            try {
                console.log("[Auth] Sending login request to:", window.API_BASE_URL + '/api/auth/login');
                const response = await fetch(window.API_BASE_URL + '/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: pass, role: 'review' })
                });
                console.log("[Auth] Response status:", response.status);
                const data = await response.json();
                console.log("[Auth] Response data:", data);"""

fetch_part_new = """            try {
                console.log("[Auth] Sending login request to:", window.API_BASE_URL + '/api/auth/login');
                const response = await fetch(window.API_BASE_URL + '/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: pass, role: 'review' })
                });
                console.log("[Auth] Response status:", response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log("[Auth] Response data:", data);"""

login_success_part_old = """                    loginSuccess(email, pass);
                } else {
                    errDiv.textContent = data.error || '認証に失敗しました。';
                    errDiv.style.display = 'block';
                }
            } catch (e) {
                console.error(e);
                errDiv.textContent = '接続エラーが発生しました。';
                errDiv.style.display = 'block';
            }"""

login_success_part_new = """                    console.log("[Auth] Login success directly without 2FA");
                    loginSuccess(email, pass);
                } else {
                    console.warn("[Auth] Login request failed:", data.error);
                    errDiv.textContent = data.error || '認証に失敗しました。';
                    errDiv.style.display = 'block';
                }
            } catch (e) {
                console.error("[Auth] Login request exception:", e);
                errDiv.textContent = '接続エラーが発生しました。: ' + e.message;
                errDiv.style.display = 'block';
            }"""

# Perform replacements safely using exact string replaces
count_1 = content_lf.count(target_1)
count_2 = content_lf.count(target_2)
count_3 = content_lf.count(target_3)
count_f = content_lf.count(fetch_part_old)
count_l = content_lf.count(login_success_part_old)

print(f"Target 1 match: {count_1}")
print(f"Target 2 match: {count_2}")
print(f"Target 3 match: {count_3}")
print(f"Target f match: {count_f}")
print(f"Target l match: {count_l}")

if count_1 == 1 and count_2 == 1 and count_3 == 1 and count_f == 1 and count_l == 1:
    content_lf = content_lf.replace(target_1, replacement_1)
    content_lf = content_lf.replace(target_2, replacement_2)
    content_lf = content_lf.replace(target_3, replacement_3)
    content_lf = content_lf.replace(fetch_part_old, fetch_part_new)
    content_lf = content_lf.replace(login_success_part_old, login_success_part_new)
    
    # Save back
    final_content = content_lf.replace("\n", original_ending)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print("SUCCESS: File successfully patched!")
else:
    print("ERROR: One or more targets did not match exactly once.")
