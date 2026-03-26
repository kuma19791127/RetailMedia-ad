const fs = require('fs');

const file = 'C:\\Users\\one\\Desktop\\RetailMedia_System\\agency_portal.html';
let html = fs.readFileSync(file, 'utf8');

const target = `                if (response.ok) {
                    alert('申請を登録しました。\\n管理者の承認をお待ちください。');
                    // Reset form
                    document.getElementById('client-email').value = "";
                    document.getElementById('price').value = "";
                    document.getElementById('delivery-date').value = "";`;

const replacement = `                if (response.ok) {
                    alert('申請を登録しました。\\n管理者の承認をお待ちください。');
                    // Reset form
                    document.getElementById('client-email').value = "";
                    document.getElementById('price').value = "";
                    document.getElementById('delivery-date').value = "";
                    
                    // Dashboardへ遷移してリスト更新
                    loadAgencyStats();
                    switchTab('dashboard', document.querySelector('.bottom-nav .nav-item'));`;

html = html.replace(target, replacement);

// Additionally clear demo address visually in HTML if it exists natively. It uses placeholder "client@example.com", which is fine.

fs.writeFileSync(file, html, 'utf8');
console.log('Fixed agency_portal.html form submission.');
