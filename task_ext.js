const fs = require('fs');
const t = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js','utf8');
const start = t.indexOf("if (rawUrl.startsWith('data:video/");
console.log(t.substring(start, start + 1200));
