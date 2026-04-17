const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/store_portal.html', 'utf8');

// Replace anywhere_regi link in store_portal.html with the "JANコードを読み込む" link pointing to anywhere_regi.html
const oldLinkStr = `<a href="anywhere_regi.html" style="text-decoration:none; color:inherit;">
            <div class="nav-item">
                <span class="nav-icon">📱</span> どこでもレジ (Local)
            </div>
        </a>`;

const newLinkStr = `<a href="anywhere_regi.html" target="_blank" style="text-decoration:none; color:#fbbf24; font-weight:bold;">
            <div class="nav-item">
                <span class="nav-icon">📱</span> <i class="fa-solid fa-barcode"></i> JANコードを読み取る
            </div>
        </a>`;

if (doc.includes(oldLinkStr)) {
    doc = doc.replace(oldLinkStr, newLinkStr);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/store_portal.html', doc, 'utf8');
    console.log('Replaced local anywhere link with JAN barcode scanner link in store portal.');
}

// Ensure POS admin has it too if the user uses pos_admin for settings
let posDoc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/pos_admin.html', 'utf8');
const pLink = `<a href="#settings" class="sidebar-link" onclick="showTab('settings')"><i class="fa-solid fa-gear"></i> 連携設定</a>`;
const pNewLink = `\n                <a href="anywhere_regi.html" target="_blank" class="sidebar-link" style="color:#fbbf24; font-weight:bold;"><i class="fa-solid fa-barcode"></i> JANコードを読み込む</a>`;
if(posDoc.includes(pLink) && !posDoc.includes('JANコードを読み込む')) {
    posDoc = posDoc.replace(pLink, pLink + pNewLink);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/pos_admin.html', posDoc, 'utf8');
}
