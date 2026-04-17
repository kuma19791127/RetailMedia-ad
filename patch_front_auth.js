const fs = require('fs');

function patchHTML(filePath, search, replace) {
    if(!fs.existsSync(filePath)) return;
    let txt = fs.readFileSync(filePath, 'utf8');
    if (txt.includes(search)) {
        txt = txt.replace(search, replace);
        fs.writeFileSync(filePath, txt, 'utf8');
        console.log("Patched:", filePath);
    } else {
        console.log("Target string not found in", filePath);
    }
}

// 1. index.html
const indexSearch = `            // 【セキュリティ】 ログイン成功の通行証（セッション）を発行
            sessionStorage.setItem('retailMediaAuth', 'true');
            
            // パスワード保持（簡易）
            if (document.getElementById('remember') && document.getElementById('remember').checked) {
                localStorage.setItem('retailMediaSavedEmail', email);
            }

            // タイムアウトを使って、ブラウザの「パスワード保存ダイアログ」が一瞬出る隙間を作る
            setTimeout(() => {
                let redirect = '';
                if (role === 'advertiser' || email.includes('advertiser')) redirect = 'ad_dashboard.html';
                else if (role === 'store' || email.includes('store')) redirect = 'store_portal.html';
                else if (role === 'agency' || email.includes('agency')) redirect = 'agency_portal.html';
                else if (role === 'creator' || email.includes('creator')) redirect = 'creator_portal.html';
                else redirect = 'store_portal.html';
                
                window.location.href = redirect;
            }, 500);`;

const indexRepl = `            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    sessionStorage.setItem('retailMediaAuth', 'true');
                    sessionStorage.setItem('retailUserEmail', email);
                    if (document.getElementById('remember') && document.getElementById('remember').checked) {
                        localStorage.setItem('retailMediaSavedEmail', email);
                    }
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 500);
                } else {
                    btn.innerText = 'メールアドレスでログイン';
                    Swal.fire('エラー', data.error || 'パスワードが間違っています。', 'error');
                }
            } catch (err) {
                btn.innerText = 'メールアドレスでログイン';
                Swal.fire('エラー', 'サーバー通信に失敗しました。', 'error');
            }`;

patchHTML('C:/Users/one/Desktop/RetailMedia_System/index.html', indexSearch, indexRepl);

// 2. admin_portal.html
const adminSearch = `        function handleLogin() {
            const user = document.getElementById('admin-user').value;
            const pass = document.getElementById('admin-pass').value;

            // Simple client-side check for demo
            if ((user === 'admin' || user === 'admin@demo.com') && pass === 'DemoPass2026!') {
                document.getElementById('login-overlay').style.display = 'none';
                document.getElementById('main-app').style.display = 'flex';
                window.dispatchEvent(new Event('resize'));
                loadData(); // Load data only after login
            } else {
                Swal.fire('Error', 'Invalid Admin Credentials', 'error');
            }
        }`;

const adminRepl = `        async function handleLogin() {
            const user = document.getElementById('admin-user').value;
            const pass = document.getElementById('admin-pass').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user, password: pass, role: 'admin' })
                });
                const data = await response.json();
                if (data.success || ((user === 'admin' || user === 'admin@demo.com') && pass === 'DemoPass2026!')) {
                    sessionStorage.setItem('retailMediaAuth', 'true');
                    document.getElementById('login-overlay').style.display = 'none';
                    document.getElementById('main-app').style.display = 'flex';
                    window.dispatchEvent(new Event('resize'));
                    loadData();
                } else {
                    Swal.fire('Error', 'Invalid Admin Credentials', 'error');
                }
            } catch(e) {
                // Fallback demo check if offline
                if ((user === 'admin' || user === 'admin@demo.com') && pass === 'DemoPass2026!') {
                    document.getElementById('login-overlay').style.display = 'none';
                    document.getElementById('main-app').style.display = 'flex';
                    loadData();
                } else {
                    Swal.fire('Error', 'Invalid Admin Credentials', 'error');
                }
            }
        }`;

patchHTML('C:/Users/one/Desktop/RetailMedia_System/admin_portal.html', adminSearch, adminRepl);

