const fs = require('fs');

let txt = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', 'utf8');
const search = `        function doLogin() {
            const org = "Demo Corp";
            const name = document.getElementById('login-name').value.trim();
            const email = document.getElementById('login-email').value.trim();
            const role = document.getElementById('login-role').value;
            if(!org || !name) { Swal.fire('エラー', '組織名と名前を入力するか、デモログインを押してください', 'error'); return; }
            currentUser = { org, name, email, role, avatar: name.charAt(0) };
            localStorage.setItem('ag_user', JSON.stringify(currentUser));
            window.location.hash = '#' + role;
            checkRoute();
            renderChat(); // Force re-render with new identity
        }`;

const repl = `        async function doLogin() {
            const org = "Demo Corp";
            const name = document.getElementById('login-name').value.trim();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-pass') ? document.getElementById('login-pass').value : 'demo1234!!';
            const role = document.getElementById('login-role').value;
            if(!name || !email) { Swal.fire('エラー', '名前とメールを入力してください', 'error'); return; }
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: pass, role: role })
                });
                const data = await response.json();
                if (data.success) {
                    sessionStorage.setItem('retailMediaAuth', 'true');
                    currentUser = { org, name, email, role, avatar: name.charAt(0) };
                    localStorage.setItem('ag_user', JSON.stringify(currentUser));
                    window.location.hash = '#' + role;
                    checkRoute();
                    renderChat();
                } else {
                    Swal.fire('エラー', data.error || 'パスワードが間違っています。', 'error');
                }
            } catch(e) {
                // Fallback for demo
                currentUser = { org, name, email, role, avatar: name.charAt(0) };
                localStorage.setItem('ag_user', JSON.stringify(currentUser));
                window.location.hash = '#' + role;
                checkRoute();
                renderChat();
            }
        }`;

if (txt.includes(search)) {
    txt = txt.replace(search, repl);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', txt, 'utf8');
    console.log("Patched manualhelp.html");
} else {
    console.log("Target string not found in manualhelp.html");
}
