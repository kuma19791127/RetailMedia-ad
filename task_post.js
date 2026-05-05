const fs = require('fs');
const t = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js','utf8');
const start = t.indexOf("app.post('/api/campaigns',");
console.log(t.substring(start, start + 1200));
