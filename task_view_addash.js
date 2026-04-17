const fs = require('fs');
const t = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html','utf8');
const searchStr = `<h3 style="margin-top:0; border-bottom:1px solid #cbd5e1; padding-bottom:10px; color:#334155;">👤 プロフィール設定 (組織・アカウント)</h3>`;
const start = t.indexOf(searchStr);
console.log(t.substring(Math.max(0, start), start + 1200));
