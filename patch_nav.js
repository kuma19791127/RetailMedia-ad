const fs = require('fs');

let sp = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/store_portal.html', 'utf8');

const target = `<a href="anywhere_regi.html" style="text-decoration:none; color:inherit;">`;
const repl = `<a href="pos_admin.html" style="text-decoration:none; color:inherit;" target="_blank">
            <div class="nav-item">
                <span class="nav-icon">💳</span> モバイルPOS 店舗管理
            </div>
        </a>
        <a href="anywhere_regi.html" style="text-decoration:none; color:inherit;">`;

if(sp.includes(target) && !sp.includes('pos_admin.html')) {
    sp = sp.replace(target, repl);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/store_portal.html', sp, 'utf8');
}

console.log('patched store_portal.html nav');
