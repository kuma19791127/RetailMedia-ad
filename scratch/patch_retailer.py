import os

file_path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\retailer_portal.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to LF for consistent replacement
original_ending = "\r\n" if "\r\n" in content else "\n"
content_lf = content.replace("\r\n", "\n")

# Replacement 1: handleLogin
start_idx_1 = content_lf.find("        async function handleLogin(e) {")
end_idx_1 = content_lf.find("        function loginSuccess(email, pass) {")

if start_idx_1 != -1 and end_idx_1 != -1 and start_idx_1 < end_idx_1:
    old_handle_login = content_lf[start_idx_1:end_idx_1]
    new_handle_login = """        async function handleLogin(e) {
            if (e) e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value.trim();
            
            if(!email || !pass) {
                console.warn("[F12 Debug] Login aborted: missing email or password");
                document.getElementById('login-error').innerText = "メールアドレスとパスワードを入力してください。";
                document.getElementById('login-error').style.display = 'block';
                return;
            }

            console.log("[Auth] Form submitted. Email:", email, "Role: store");
            try {
                console.log("[Auth] Sending login request to:", window.API_BASE_URL + '/api/auth/login');
                const response = await fetch(window.API_BASE_URL + '/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: pass, role: 'store' })
                });
                console.log("[Auth] Response status:", response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log("[Auth] Response data:", data);
                
                if (data.success) {
                    if (data.require2FA) {
                        console.log("[Auth] Require 2FA verification");
                        Swal.close();
                        const { value: totpCode } = await Swal.fire({
                            title: '🔑 2段階認証コード',
                            html: '認証アプリに表示される<br>6桁のコードを入力してください<br>最初にログインしたstore or retailerと共通',
                            input: 'text',
                            inputPlaceholder: '6桁のコードを入力',
                            showCancelButton: true,
                            confirmButtonText: '認証',
                            cancelButtonText: 'キャンセル',
                            inputValidator: (value) => {
                                if (!value || value.length !== 6) return '6桁の数字を入力してください';
                            },
                            footer: '<a href="javascript:void(0)" id="reset-2fa-link" style="color:#d33; font-weight:bold; font-size:12px;">QRコードを再スキャンする（2FAを再設定）</a>',
                            didOpen: () => {
                                document.getElementById('reset-2fa-link').onclick = async () => {
                                    console.log("[Auth] Reset 2FA clicked");
                                    Swal.close();
                                    const confirmReset = await Swal.fire({
                                        title: '2FAの再設定',
                                        text: '現在の二段階認証設定を削除し、新しいQRコードを発行しますか？',
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonText: 'はい、再設定する',
                                        cancelButtonText: 'キャンセル'
                                    });
                                    if (confirmReset.isConfirmed) {
                                        try {
                                            console.log("[Auth] Sending reset 2FA request for email:", email);
                                            const resetRes = await fetch(window.API_BASE_URL + '/api/auth/reset-2fa', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email, role: 'store' })
                                            });
                                            console.log("[Auth] Reset 2FA response status:", resetRes.status);
                                            const resetData = await resetRes.json();
                                            console.log("[Auth] Reset 2FA response data:", resetData);
                                            if (resetData.success) {
                                                Swal.fire('リセット完了', '再度ログインしてQRコードをスキャンしてください。', 'success');
                                            } else {
                                                Swal.fire('エラー', '2FAリセットに失敗しました。', 'error');
                                            }
                                        } catch (resetErr) {
                                            console.error("[Auth] Reset 2FA exception:", resetErr);
                                            Swal.fire('エラー', '通信エラーにより2FAリセットに失敗しました。', 'error');
                                        }
                                    }
                                };
                            }
                        });

                        if (!totpCode) {
                            console.log("[Auth] 2FA totpCode prompt cancelled by user");
                            return;
                        }

                        console.log("[Auth] 2FA code entered:", totpCode);
                        Swal.fire({ title: '認証中...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                        
                        console.log("[Auth] Verifying 2FA token...");
                        const verifyRes = await fetch(window.API_BASE_URL + '/api/auth/2fa/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, token: totpCode, role: 'store' })
                        });
                        console.log("[Auth] 2FA verification response status:", verifyRes.status);
                        const verifyData = await verifyRes.json();
                        console.log("[Auth] 2FA verification response data:", verifyData);
                        
                        if (verifyData.success) {
                            console.log("[Auth] 2FA verification success");
                            loginSuccess(email, pass);
                            Swal.close();
                        } else {
                            console.warn("[Auth] 2FA verification failed:", verifyData.error);
                            Swal.close();
                            Swal.fire({
                                title: '認証エラー',
                                text: verifyData.error || '認証コードが違います。',
                                icon: 'error',
                                showCancelButton: true,
                                confirmButtonText: '閉じる',
                                cancelButtonText: '2FAを再設定する',
                                cancelButtonColor: '#d33'
                            }).then(async (result) => {
                                if (result.dismiss === Swal.DismissReason.cancel) {
                                    try {
                                        console.log("[Auth] Requesting 2FA reset from error dialog...");
                                        const resetRes = await fetch(window.API_BASE_URL + '/api/auth/reset-2fa', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email, role: 'store' })
                                        });
                                        const resetData = await resetRes.json();
                                        if (resetData.success) {
                                            Swal.fire('リセット完了', '再度ログインしてQRコードをスキャンしてください。', 'success');
                                        } else {
                                            Swal.fire('エラー', '2FAリセットに失敗しました。', 'error');
                                        }
                                    } catch (resetErr) {
                                        console.error("[Auth] Reset 2FA exception from dialog:", resetErr);
                                        Swal.fire('エラー', '通信エラーにより2FAリセットに失敗しました。', 'error');
                                    }
                                }
                            });
                        }
                        return;
                    }

                    if (data.require2FASetup) {
                        console.log("[Auth] Require 2FA Setup");
                        Swal.close();
                        Swal.fire({ title: '2FA初期設定中...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                        console.log("[Auth] Requesting 2FA setup details...");
                        const setupRes = await fetch(window.API_BASE_URL + '/api/auth/2fa/setup', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, role: 'store' })
                        });
                        console.log("[Auth] 2FA setup response status:", setupRes.status);
                        const setupData = await setupRes.json();
                        console.log("[Auth] 2FA setup response:", setupData);
                        
                        console.log("[Auth] Opening 2FA setup modal directly (replacing loading spinner)...");
                        Swal.close();

                        const { value: totpCode } = await Swal.fire({
                            title: '🔑 2段階認証の有効化',
                            html: `
                                <p style="font-size:0.9rem;">認証アプリで以下のQRコードをスキャンし、生成された6桁のコードを入力してください。</p>
                                <img src="${setupData.qrcode}" style="margin: 15px auto; display:block; max-width:180px;">
                                <p style="font-size:0.8rem; color:#888;">シークレットキー: <code>${setupData.secret}</code></p>
                            `,
                            input: 'text',
                            inputPlaceholder: '6桁のコード',
                            showCancelButton: true,
                            confirmButtonText: '有効化する',
                            cancelButtonText: 'キャンセル',
                            inputValidator: (value) => {
                                if (!value || value.length !== 6) return '6桁の数字を入力してください';
                            }
                        });

                        if (!totpCode) {
                            console.log("[Auth] 2FA Setup prompt cancelled by user");
                            return;
                        }

                        console.log("[Auth] 2FA Setup code entered:", totpCode);
                        Swal.fire({ title: '設定検証中...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                        const verifyRes = await fetch(window.API_BASE_URL + '/api/auth/2fa/enable', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, token: totpCode, secret: setupData.secret, role: 'store' })
                        });
                        console.log("[Auth] 2FA enable response status:", verifyRes.status);
                        const verifyData = await verifyRes.json();
                        console.log("[Auth] 2FA enable response data:", verifyData);

                        if (verifyData.success) {
                            console.log("[Auth] 2FA Setup verify success");
                            loginSuccess(email, pass);
                            Swal.close();
                        } else {
                            console.warn("[Auth] 2FA Setup verify failed:", verifyData.error);
                            Swal.close();
                            Swal.fire('設定エラー', verifyData.error || '認証コードが違います。設定をやり直してください。', 'error');
                        }
                        return;
                    }

                    console.log("[Auth] Login success directly without 2FA");
                    loginSuccess(email, pass);
                } else {
                    console.warn("[Auth] Login request failed:", data.error);
                    document.getElementById('login-error').innerText = data.error || "認証に失敗しました";
                    document.getElementById('login-error').style.display = 'block';
                }
            } catch (e) {
                console.error("[Auth] Login request exception:", e);
                document.getElementById('login-error').innerText = "接続エラーが発生しました。: " + e.message;
                document.getElementById('login-error').style.display = 'block';
            }
        }
        
"""
    content_lf = content_lf.replace(old_handle_login, new_handle_login)
    print("SUCCESS: handleLogin replaced successfully!")
else:
    print("ERROR: handleLogin start/end points not found.")

# Replacement 2: sendBulkEmail
start_idx_2 = content_lf.find("async function sendBulkEmail() {")
end_idx_2 = content_lf.find("async function downloadBulkZip() {")

if start_idx_2 != -1 and end_idx_2 != -1 and start_idx_2 < end_idx_2:
    old_send_bulk = content_lf[start_idx_2:end_idx_2]
    new_send_bulk = """async function sendBulkEmail() {
    console.log("[F12 Debug] sendBulkEmail initiated");
    const list = parseBulkList().filter(item => item.email !== "");
    if (list.length === 0) {
        console.warn("[F12 Debug] sendBulkEmail aborted: empty or invalid list");
        Swal.fire("エラー", "有効な「店舗番号, メールアドレス」のペアを入力してください。", "error");
        return;
    }

    console.log("[F12 Debug] Target bulk list:", list);
    Swal.fire({
        title: 'メール一斉送信中...',
        text: `${list.length}店舗宛てにセットアップ案内を配信しています。`,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const payload = {
            prefix: currentPrefix,
            list: list,
            senderEmail: currentEmail
        };
        console.log("[F12 Debug] Sending POST request to bulk-email API with payload:", payload);
        const res = await fetch((window.API_BASE_URL || '') + '/api/retailer/bulk-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        console.log("[F12 Debug] bulk-email API response status:", res.status);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log("[F12 Debug] bulk-email API response data:", data);
        if (data.success) {
            Swal.fire("送信完了", `${list.length}店舗へのセットアップ資材の自動配信が完了しました。`, "success");
        } else {
            throw new Error(data.error || "送信処理中にエラーが発生しました。");
        }
    } catch (err) {
        console.error("[F12 Debug] Error in sendBulkEmail:", err);
        Swal.fire("エラー", "メール一括送信に失敗しました: " + err.message, "error");
    }
}

"""
    content_lf = content_lf.replace(old_send_bulk, new_send_bulk)
    print("SUCCESS: sendBulkEmail replaced successfully!")
else:
    print("ERROR: sendBulkEmail start/end points not found.")

# Replacement 3: loadVideos and deleteVideo
start_idx_3 = content_lf.find("async function loadVideos() {")
end_idx_3 = content_lf.find("function showUrlDetail() {")

if start_idx_3 != -1 and end_idx_3 != -1 and start_idx_3 < end_idx_3:
    old_load_videos = content_lf[start_idx_3:end_idx_3]
    new_load_videos = """async function loadVideos() {
    console.log("[F12 Debug] loadVideos initiated with prefix:", currentPrefix);
    try {
        console.log("[F12 Debug] Fetching videos from:", window.API_BASE_URL + '/api/retailer/videos?prefix=' + currentPrefix);
        const res = await fetch(window.API_BASE_URL + '/api/retailer/videos?prefix=' + currentPrefix, {
            credentials: 'include'
        });
        console.log("[F12 Debug] loadVideos fetch status:", res.status);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const videos = await res.json();
        console.log("[F12 Debug] loadVideos fetched videos count:", videos.length);
        let html = '';
        if(videos.length === 0) {
            html = '<p style="padding:15px; color:#94a3b8;">現在配信中の独自動画はありません。</p>';
        } else {
            videos.forEach(v => {
                html += `
                <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#1e293b;">${v.title}</strong><br>
                        <span style="font-size:0.85rem; color:#64748b;">配信先: ${v.target_store === 'ALL' ? '全店舗' : v.target_store}</span>
                    </div>
                    <button onclick="deleteVideo('${v.id}')" style="color:red; background:none; border:1px solid red; border-radius:5px; padding:5px 10px; cursor:pointer;">配信停止</button>
                </div>`;
            });
        }
        document.getElementById('video-list').innerHTML = html;
    } catch(e) {
        console.error("[F12 Debug] Error loading videos:", e);
        document.getElementById('video-list').innerHTML = `<p style="padding:15px; color:#ef4444;">動画一覧の取得中に通信エラーが発生しました: ${e.message}</p>`;
    }
}

async function deleteVideo(id) {
    console.log("[F12 Debug] deleteVideo requested for ID:", id);
    if(confirm("この動画の配信を停止し、削除しますか？")) {
        try {
            console.log("[F12 Debug] Sending DELETE request to:", window.API_BASE_URL + '/api/retailer/videos/' + id);
            const res = await fetch(window.API_BASE_URL + '/api/retailer/videos/' + id, { 
                method: 'DELETE',
                credentials: 'include'
            });
            console.log("[F12 Debug] deleteVideo response status:", res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            console.log("[F12 Debug] deleteVideo response data:", data);
            if (data.success) {
                Swal.fire("削除完了", "動画の配信停止および削除が完了しました。", "success");
                loadVideos();
            } else {
                throw new Error(data.error || "削除処理に失敗しました。");
            }
        } catch (e) {
            console.error("[F12 Debug] Error deleting video:", e);
            Swal.fire("エラー", "配信停止に失敗しました: " + e.message, "error");
        }
    }
}

"""
    content_lf = content_lf.replace(old_load_videos, new_load_videos)
    print("SUCCESS: loadVideos and deleteVideo replaced successfully!")
else:
    print("ERROR: loadVideos start/end points not found.")

# Write back
final_content = content_lf.replace("\n", original_ending)
with open(file_path, "w", encoding="utf-8") as f:
    f.write(final_content)
print("COMPLETED!")
