const fs = require('fs');

console.log('--- creator_lp.html ---');
const crLines = fs.readFileSync('creator_lp.html', 'utf8').split('\n');
console.log(crLines.slice(285, 315).join('\n'));

console.log('\n--- agency_lp.html ---');
const agLines = fs.readFileSync('agency_lp.html', 'utf8').split('\n');
console.log(agLines.slice(510, 560).join('\n'));
