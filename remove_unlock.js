const fs = require('fs');
const path = require('path');
const p1 = 'C:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html';

if (fs.existsSync(p1)) {
    let txt = fs.readFileSync(p1, 'utf8');
    // Remove the button
    txt = txt.replace(/<button[^>]*onclick="requestUnlock\(\)"[^>]*>.*?<\/button>/gs, '');
    // Remove the function
    txt = txt.replace(/function requestUnlock\(\)\s*\{[\s\S]*?\}\s*(?=\s*<\/script>|\s*function)/gs, '');
    // Remove any remaining script tag that might be empty or just holding requestUnlock
    txt = txt.replace(/<script>\s*<\/script>/gs, '');
    fs.writeFileSync(p1, txt);
    console.log('Cleaned ad_dashboard.html');
}

// Since the prompt mainly specified advertiser, but let's check creator_portal just in case we need it there. The prompt said "ロックされた広告主が...削除して" so we definitely remove it from ad_dashboard.
