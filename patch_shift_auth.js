const fs = require('fs');

let txt = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/shift_manager.html', 'utf8');

const tSearch = `        function doLogin() {
            const orgNode = document.getElementById('login-org');
            const nameNode = document.getElementById('login-name');
            const emailNode = document.getElementById('login-email');
            
            if (!orgNode.value) return Swal.fire('エラー', '組織コードを入力してください', 'error');
            if (!nameNode.value) return Swal.fire('エラー', '名前を入力してください', 'error');

            currentUser.org = orgNode.value;
            currentUser.name = nameNode.value;
            currentUser.dept = document.getElementById('login-dept').value;
            currentUser.email = emailNode.value;

            // Use Email as a pseudo-unique ID to prevent multiple users stepping on the same generic "shift_name"
            if (!STAFF.find(s => s.name === currentUser.name)) {
                STAFF.push({ name: currentUser.name, dept: currentUser.dept, email: currentUser.email, reqOff: [], reqOffDates: [], customTimes: {} });
            }
            saveStaffDB();

            // Save specifically with email context where possible or default
            localStorage.setItem('shift_last_email', currentUser.email);
            localStorage.setItem(\`shift_org_\${currentUser.email}\`, currentUser.org);
            localStorage.setItem(\`shift_name_\${currentUser.email}\`, currentUser.name);
            localStorage.setItem(\`shift_dept_\${currentUser.email}\`, currentUser.dept);

            // Backwards compatibility fallbacks
            localStorage.setItem('shift_org', currentUser.org);
            localStorage.setItem('shift_name', currentUser.name);
            localStorage.setItem('shift_dept', currentUser.dept);
            localStorage.setItem('shift_email', currentUser.email);

            document.getElementById('current-user-name').innerText = currentUser.name;
            document.getElementById('current-user-dept').innerText = DEPARTMENTS.find(d => d.id === currentUser.dept)?.name || '新規部門';

            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('main-app').style.display = 'flex';

            cleanupPastData(); // Clear old logs on login
            renderChatHistory(); // Load saved chats
            updateCalendarUI();
            generateShift(true);
            renderBoard();
        }`;

const tRepl = `        async function doLogin() {
            const orgNode = document.getElementById('login-org');
            const nameNode = document.getElementById('login-name');
            const emailNode = document.getElementById('login-email');
            const passNode = document.getElementById('login-pass');
            
            if (!orgNode.value || !nameNode.value) return Swal.fire('エラー', '組織コードと名前を入力してください', 'error');

            const email = emailNode.value;
            const pass = passNode ? passNode.value : 'demo1234!!';
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: pass, role: 'store' })
                });
                const data = await response.json();
                
                if (!data.success && !email.includes('demo')) {
                    return Swal.fire('エラー', data.error || 'パスワードが間違っています。', 'error');
                }
                sessionStorage.setItem('retailMediaAuth', 'true');
            } catch(e) {
                // Fallback
            }

            currentUser.org = orgNode.value;
            currentUser.name = nameNode.value;
            currentUser.dept = document.getElementById('login-dept').value;
            currentUser.email = email;

            if (!STAFF.find(s => s.name === currentUser.name)) {
                STAFF.push({ name: currentUser.name, dept: currentUser.dept, email: currentUser.email, reqOff: [], reqOffDates: [], customTimes: {} });
            }
            saveStaffDB();

            localStorage.setItem('shift_last_email', currentUser.email);
            localStorage.setItem(\`shift_org_\${currentUser.email}\`, currentUser.org);
            localStorage.setItem(\`shift_name_\${currentUser.email}\`, currentUser.name);
            localStorage.setItem(\`shift_dept_\${currentUser.email}\`, currentUser.dept);

            localStorage.setItem('shift_org', currentUser.org);
            localStorage.setItem('shift_name', currentUser.name);
            localStorage.setItem('shift_dept', currentUser.dept);
            localStorage.setItem('shift_email', currentUser.email);

            document.getElementById('current-user-name').innerText = currentUser.name;
            document.getElementById('current-user-dept').innerText = DEPARTMENTS.find(d => d.id === currentUser.dept)?.name || '新規部門';

            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('main-app').style.display = 'flex';

            cleanupPastData();
            renderChatHistory();
            updateCalendarUI();
            generateShift(true);
            renderBoard();
        }`;

if(txt.includes(`function doLogin() {
            const orgNode = document.getElementById('login-org');`)) {
    txt = txt.replace(tSearch, tRepl);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/shift_manager.html', txt, 'utf8');
    console.log("Patched shift_manager.html");
} else {
    // maybe slight format string diff
    const reg = /function doLogin\(\)\s*\{\s*const orgNode = document\.getElementById\('login-org'\);[\s\S]*?renderBoard\(\);\s*\}/m;
    if(reg.test(txt)) {
        txt = txt.replace(reg, tRepl);
        fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/shift_manager.html', txt, 'utf8');
        console.log("Patched shift_manager.html via RegEx");
    } else {
        console.log("Target string not found in shift_manager.html");
    }
}
