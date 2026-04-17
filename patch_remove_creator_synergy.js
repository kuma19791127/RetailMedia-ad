const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', 'utf8');

// I will find the block to delete by string coordinates
const startMarker = `// Link POS Sales to Creator Synergy Score & Revenue`;
const endMarker = "res.json({ success: true, message: \"Synced to Admin Server\" });";

if(doc.includes(startMarker)) {
    const p1 = doc.indexOf(startMarker);
    const p2 = doc.indexOf(endMarker, p1);
    
    if (p1 > -1 && p2 > -1) {
        const replacement = `// 独立したモジュールであるため、POS決済データとCreator（サイネージ広告枠）の直接的なコミッション連動は行いません\n\n        `;
        doc = doc.substring(0, p1) + replacement + doc.substring(p2);
        fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', doc, 'utf8');
        console.log('Successfully removed Creator Synergy POS linking.');
    } else {
        console.log('Could not find end marker.');
    }
} else {
    console.log('Could not find start marker.');
}
