const fs = require('fs');

let aw = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/anywhere_regi.html', 'utf8');

const tSearch = `<a href="anywhere_lp.html" target="_blank" style="color:#10B981; font-weight:bold; text-decoration:none;">📖 どこでもレジ サービス詳細 (LP) を見る</a>`;
const tRepl = `<a href="index.html" style="color:#2563EB; font-weight:bold; text-decoration:none; display:block; margin-bottom:10px;">👔 小売店舗・管理者向けのログインはこちら</a>
                <a href="anywhere_lp.html" target="_blank" style="color:#10B981; font-weight:bold; text-decoration:none; display:block;">📖 どこでもレジ サービス詳細 (LP) を見る</a>`;

if (aw.includes(tSearch)) {
    aw = aw.replace(tSearch, tRepl);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/anywhere_regi.html', aw, 'utf8');
    console.log("Patched anywhere_regi.html link.");
} else {
    // try regex for fallback
    const r = /<a href="anywhere_lp\.html"[\s\S]*?LP\).*?<\/a>/i;
    if(r.test(aw)) {
        aw = aw.replace(r, tRepl);
        fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/anywhere_regi.html', aw, 'utf8');
        console.log("Patched anywhere_regi.html link via RegEx.");
    } else {
        console.log("Target string not found in anywhere_regi.html");
    }
}
