const fs = require('fs');
const text = fs.readFileSync('C:\\Users\\one\\Desktop\\RetailMedia_System\\advertiser_dashboard.html', 'utf8');
const lines = text.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('広告離脱率') || lines[i].includes('配信端末') || lines[i].includes('registerCreditCard') || lines[i].includes('chargeBudget')) {
        console.log(`${i + 1}: ${lines[i].trim()}`);
    }
}
