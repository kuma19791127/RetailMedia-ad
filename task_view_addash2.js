const fs = require('fs');
const t = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html','utf8');
const searchStr = `<input type="email" id="prof-email"`;
const start = t.indexOf(searchStr);
console.log(t.substring(Math.max(0, start), start + 1200));
