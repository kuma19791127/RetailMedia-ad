const fs = require('fs');
const t = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js','utf8');
const searchStr = "const dataStr = JSON.stringify({";
const start = t.indexOf(searchStr);
console.log(t.substring(Math.max(0, start), start + 800));
