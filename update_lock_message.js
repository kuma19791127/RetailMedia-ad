const fs = require('fs');
const path = require('path');
const p1 = 'C:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html';

if (fs.existsSync(p1)) {
    let txt = fs.readFileSync(p1, 'utf8');
    // Update the SweetAlert message to reflect that admin will review, removing the instruction to click the unlock request
    txt = txt.replace(/配信を再開するには解除申請を行ってください。/g, '運営(Admin)による実態審査をお待ちください。');
    fs.writeFileSync(p1, txt);
    console.log('Updated lock message in ad_dashboard.html');
}
