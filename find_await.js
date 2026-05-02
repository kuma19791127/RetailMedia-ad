const fs = require('fs');
const html = fs.readFileSync('ad_dashboard.html', 'utf8');
const regex = /on\w+="([^"]*)"/g;
let match;
while ((match = regex.exec(html)) !== null) {
    if (match[1].includes('await')) {
        console.log("FOUND AWAIT IN:", match[1]);
    }
}
const regex2 = /on\w+='([^']*)'/g;
while ((match = regex2.exec(html)) !== null) {
    if (match[1].includes('await')) {
        console.log("FOUND AWAIT IN:", match[1]);
    }
}
