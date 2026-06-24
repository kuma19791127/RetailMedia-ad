import os

file_path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\manualhelp.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to LF
original_ending = "\r\n" if "\r\n" in content else "\n"
content_lf = content.replace("\r\n", "\n")

# Definition 1: Form tag replacement (onsubmit)
target_form = """            <form id="login-form" action="about:blank" target="dummyframe_login" method="POST" onsubmit="setTimeout(doLogin, 10); return true;" style="width:100%; margin:0; padding:0;">"""
replacement_form = """            <form id="login-form" onsubmit="doLogin(event);" style="width:100%; margin:0; padding:0;">"""

# Definition 2: doLogin function replacement
target_dologin = """        async function doLogin() {
            const org = "Demo Corp";
            const name = document.getElementById('login-name').value.trim();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-pass') ? document.getElementById('login-pass').value : 'demo1234!!';
            const role = document.getElementById('login-role').value;
            if(!name || !email) { Swal.fire('エラー', '名前とメールを入力してください', 'error'); return; }
            
            const body = { email: email, password: pass, role: role, name: name, org: org };
            console.log("[F12 Debug Frontend] Attempting login with body:", { ...body, password: "***" });
            
            try {
                const response = await fetch(window.API_BASE_URL + '/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                console.log("[F12 Debug Frontend] Login response status:", response.status, "data:", data);
                if (data.success) {
                    if (data.require2FA) {
                        // 2FA検証のダイアログ表示
                        const { value: totpCode } = await Swal.fire({
                            title: '🔑 2段階認証コード',
                            text: '認証アプリに表示されている6桁のコードを入力してください。',
                            input: 'text',
                            inputPlaceholder: '6桁のコードを入力',
                            showCancelButton: true,
                            confirmButtonText: '認証',
                            cancelButtonText: 'キャンセル',
                            inputValidator: (value) => {
                                if (!value || value.length !== 6) return '6桁の数字を入力してください';
                            }
                        });

                        if (!totpCode) return;

                        Swal.fire({ title: '認証中...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                        
                        const verifyRes = await fetch(window.API_BASE_URL + '/api/auth/2fa/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, token: totpCode, role: role })
                        });
                        const verifyData = await verifyRes.json();
                        
                        if (verifyData.success) {
                            Swal.close();
                            loginSuccess(email, pass, name, org, role);
                        } else {
                            Swal.fire('認証エラー', verifyData.error || '認証コードが違います。', 'error');
                        }
                        return;
                    }

                    if (data.require2FASetup) {
                        // 2FAセットアップ
                        Swal.fire({ title: '2FA初期設定中...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                        const setupRes = await fetch(window.API_BASE_URL + '/api/auth/2fa/setup', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, role: role })
                        });
                        const setupData = await setupRes.json();

                        const { value: totpCode } = await Swal.fire({
                            title: '🔑 2段階認証の有効化',
                            html: `
                                <p style="font-size:0.9rem;">認証アプリで以下のQRコードをスキャンし、生成された6桁のコードを入力してください。</p>
                                <img src="${setupData.qrcode}" style="margin: 15px auto; display:block; max-width:180px;">
                                <p style="font-size:0.8rem; color:#888;">シークレットキー: <code>${setupData.secret}</code></p>
                            `,
                            input: 'text',
                            inputPlaceholder: '6桁 of codes',
                            showCancelButton: true,
                            confirmButtonText: '有効化する',
                            cancelButtonText: 'キャンセル',
                            inputValidator: (value) => {
                                if (!value || value.length !== 6) return '6桁の数字を入力してください';
                            }
                        });

                        if (!totpCode) return;

                        Swal.fire({ title: '認証中...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

                        const enableRes = await fetch(window.API_BASE_URL + '/api/auth/2fa/enable', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, token: totpCode, secret: setupData.secret, role: role })
                        });
                        const enableData = await enableRes.json();

                        if (enableData.success) {
                            Swal.close();
                            loginSuccess(email, pass, name, org, role);
                        } else {
                            Swal.fire('設定エラー', enableData.error || '無効なコードです。', 'error');
                        }
                        return;
                    }

                    loginSuccess(email, pass, name, org, role, data.user);
                } else {
                    Swal.fire('エラー', data.error || 'パスワードが間違っています。', 'error');
                }
            } catch(e) {"""

replacement_dologin = """        async function doLogin(e) {
            if (e) e.preventDefault();
            const org = "Demo Corp";
            const name = document.getElementById('login-name').value.trim();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-pass') ? document.getElementById('login-pass').value : 'demo1234!!';
            const role = document.getElementById('login-role').value;
            if(!name || !email) { 
                console.warn("[F12 Debug Frontend] Login aborted: missing name or email");
                Swal.fire('エラー', '名前とメールを入力してください', 'error'); 
                return; 
            }
            
            const body = { email: email, password: pass, role: role, name: name, org: org };
            console.log("[F12 Debug Frontend] Attempting login with body:", { ...body, password: "***" });
            
            try {
                console.log("[F12 Debug Frontend] Sending login request to:", window.API_BASE_URL + '/api/auth/login');
                const response = await fetch(window.API_BASE_URL + '/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                console.log("[F12 Debug Frontend] Login HTTP status:", response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log("[F12 Debug Frontend] Login response data:", data);
                if (data.success) {
                    if (data.require2FA) {
                        console.log("[F12 Debug Frontend] Require 2FA verification");
                        const { value: totpCode } = await Swal.fire({
                            title: '🔑 2段階認証コード',
                            text: '認証アプリに表示されている6桁のコードを入力してください。',
                            input: 'text',
                            inputPlaceholder: '6桁のコードを入力',
                            showCancelButton: true,
                            confirmButtonText: '認証',
                            cancelButtonText: 'キャンセル',
                            inputValidator: (value) => {
                                if (!value || value.length !== 6) return '6桁 of 数字を入力してください';
                            }
                        });

                        if (!totpCode) {
                            console.log("[F12 Debug Frontend] 2FA cancelled by user");
                            return;
                        }

                        console.log("[F12 Debug Frontend] 2FA code entered:", totpCode);
                        Swal.fire({ title: '認証中...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                        
                        console.log("[F12 Debug Frontend] Verifying 2FA token...");
                        const verifyRes = await fetch(window.API_BASE_URL + '/api/auth/2fa/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, token: totpCode, role: role })
                        });
                        console.log("[F12 Debug Frontend] 2FA verification response status:", verifyRes.status);
                        if (!verifyRes.ok) {
                            throw new Error(`2FA verification HTTP error! status: ${verifyRes.status}`);
                        }
                        const verifyData = await verifyRes.json();
                        console.log("[F12 Debug Frontend] 2FA verification response data:", verifyData);
                        
                        if (verifyData.success) {
                            console.log("[F12 Debug Frontend] 2FA verification success");
                            Swal.close();
                            loginSuccess(email, pass, name, org, role);
                        } else {
                            console.warn("[F12 Debug Frontend] 2FA verification failed:", verifyData.error);
                            Swal.close();
                            Swal.fire('認証エラー', verifyData.error || '認証コードが違います。', 'error');
                        }
                        return;
                    }

                    if (data.require2FASetup) {
                        console.log("[F12 Debug Frontend] Require 2FA Setup");
                        Swal.fire({ title: '2FA初期設定中...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                        console.log("[F12 Debug Frontend] Requesting 2FA setup details...");
                        const setupRes = await fetch(window.API_BASE_URL + '/api/auth/2fa/setup', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, role: role })
                        });
                        console.log("[F12 Debug Frontend] 2FA setup response status:", setupRes.status);
                        if (!setupRes.ok) {
                            throw new Error(`2FA setup HTTP error! status: ${setupRes.status}`);
                        }
                        const setupData = await setupRes.json();
                        console.log("[F12 Debug Frontend] 2FA setup response data:", setupData);

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
                            console.log("[F12 Debug Frontend] 2FA Setup prompt cancelled by user");
                            return;
                        }

                        console.log("[F12 Debug Frontend] 2FA Setup code entered:", totpCode);
                        Swal.fire({ title: '認証中...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

                        console.log("[F12 Debug Frontend] Enabling 2FA...");
                        const enableRes = await fetch(window.API_BASE_URL + '/api/auth/2fa/enable', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, token: totpCode, secret: setupData.secret, role: role })
                        });
                        console.log("[F12 Debug Frontend] 2FA enable response status:", enableRes.status);
                        if (!enableRes.ok) {
                            throw new Error(`2FA enable HTTP error! status: ${enableRes.status}`);
                        }
                        const enableData = await enableRes.json();
                        console.log("[F12 Debug Frontend] 2FA enable response data:", enableData);

                        if (enableData.success) {
                            console.log("[F12 Debug Frontend] 2FA Setup success");
                            Swal.close();
                            loginSuccess(email, pass, name, org, role);
                        } else {
                            console.warn("[F12 Debug Frontend] 2FA Setup failed:", enableData.error);
                            Swal.close();
                            Swal.fire('設定エラー', enableData.error || '無効なコードです。', 'error');
                        }
                        return;
                    }

                    console.log("[F12 Debug Frontend] Login success directly");
                    loginSuccess(email, pass, name, org, role, data.user);
                } else {
                    console.warn("[F12 Debug Frontend] Login failed:", data.error);
                    Swal.fire('エラー', data.error || 'パスワードが間違っています。', 'error');
                }
            } catch(e) {"""

count_form = content_lf.count(target_form)
count_dologin = content_lf.count(target_dologin)

print(f"Form target count: {count_form}")
print(f"doLogin target count: {count_dologin}")

if count_form == 1 and count_dologin == 1:
    content_lf = content_lf.replace(target_form, replacement_form)
    content_lf = content_lf.replace(target_dologin, replacement_dologin)
    
    # Save back
    final_content = content_lf.replace("\n", original_ending)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print("SUCCESS: manualhelp.html updated successfully!")
else:
    print("ERROR: Targets not found exactly once in manualhelp.html")
