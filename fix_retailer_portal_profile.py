with open('retailer_portal.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''        <div id="tab-dashboard">
            <h1>法人専用ポータルへようこそ</h1>'''
replacement = '''        <div id="tab-dashboard">
            <h1>法人専用ポータルへようこそ</h1>
            <div style="background:#e0f2fe; padding:15px; border-radius:8px; margin-bottom:20px; color:#0369a1;">
                <strong>所属組織：</strong> <span id="display-org">未設定</span><br>
                <strong>アカウント（メール）：</strong> <span id="display-email">未設定</span>
            </div>'''
text = text.replace(target, replacement)

target2 = '''        async function saveProfile() {
            const org = document.getElementById('prof-org').value;
            const email = document.getElementById('prof-email').value;
            localStorage.setItem('retailer_org', org);
            localStorage.setItem('retailer_email', email);
            currentPrefix = email.split('@')[0];
            document.getElementById('retailer-prefix').value = currentPrefix;
            document.getElementById('modal-profile').style.display = 'none';
            Swal.fire({toast:true, position:'top-end', icon:'success', title:'保存しました', showConfirmButton:false, timer:3000});
        }'''
replacement2 = '''        async function saveProfile() {
            const org = document.getElementById('prof-org').value;
            const email = document.getElementById('prof-email').value;
            localStorage.setItem('retailer_org', org);
            localStorage.setItem('retailer_email', email);
            currentPrefix = email.split('@')[0];
            document.getElementById('retailer-prefix').value = currentPrefix;
            
            document.getElementById('display-org').innerText = org || '未設定';
            document.getElementById('display-email').innerText = email || '未設定';
            
            document.getElementById('modal-profile').style.display = 'none';
            Swal.fire({toast:true, position:'top-end', icon:'success', title:'プロフィールを更新しました', showConfirmButton:false, timer:3000});
        }'''
text = text.replace(target2, replacement2)

target3 = '''    window.addEventListener('DOMContentLoaded', () => {
        const savedEmail = localStorage.getItem('retailer_email');
        if (savedEmail) {
            document.getElementById('login-email').value = savedEmail;
            if (typeof currentPrefix !== 'undefined') currentPrefix = savedEmail.split('@')[0];
            if (typeof currentEmail !== 'undefined') currentEmail = savedEmail;
        }
    });'''
replacement3 = '''    window.addEventListener('DOMContentLoaded', () => {
        const savedEmail = localStorage.getItem('retailer_email');
        const savedOrg = localStorage.getItem('retailer_org');
        
        if (savedEmail) {
            document.getElementById('login-email').value = savedEmail;
            document.getElementById('prof-email').value = savedEmail;
            document.getElementById('display-email').innerText = savedEmail;
            if (typeof currentPrefix !== 'undefined') currentPrefix = savedEmail.split('@')[0];
            if (typeof currentEmail !== 'undefined') currentEmail = savedEmail;
        }
        if (savedOrg) {
            document.getElementById('prof-org').value = savedOrg;
            document.getElementById('display-org').innerText = savedOrg;
        }
    });'''
text = text.replace(target3, replacement3)

with open('retailer_portal.html', 'w', encoding='utf-8') as f:
    f.write(text)
