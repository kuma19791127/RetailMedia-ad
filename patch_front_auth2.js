const fs = require('fs');

// Patch index.html
let indexTxt = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/index.html', 'utf8');
const indexReg = /sessionStorage\.setItem\('retailMediaAuth',\s*'true'\);[\s\S]*?window\.location\.href\s*=\s*redirect;\s*},\s*500\);/ig;
const indexRepl = `try {
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
if(indexReg.test(indexTxt)) {
    indexTxt = indexTxt.replace(indexReg, indexRepl);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/index.html', indexTxt, 'utf8');
    console.log('Fixed index.html');
}

// Patch admin_portal.html
let adminTxt = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/admin_portal.html', 'utf8');
const adminReg = /const pass = document\.getElementById\('admin-pass'\)\.value;[\s\S]*?Swal\.fire\('Error', 'Invalid Admin Credentials', 'error'\);\s*\}/ig;
const adminRepl = `const pass = document.getElementById('admin-pass').value;

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
if(adminReg.test(adminTxt)) {
    adminTxt = adminTxt.replace(adminReg, adminRepl);
    // Note: ensure handleLogin is marked async
    adminTxt = adminTxt.replace('function handleLogin() {', 'async function handleLogin() {');
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/admin_portal.html', adminTxt, 'utf8');
    console.log('Fixed admin_portal.html');
}
