const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/one/Desktop/RetailMedia_System';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') || (f.endsWith('.js') && f !== 'bulk_replace.js'));

files.forEach(file => {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;
    
    // Exact matches first
    content = content.replace(/RetailMedia\.biz/g, 'retail-ad Media');
    content = content.replace(/LiteAd Creator/gi, 'retail-Ad Creator');
    content = content.replace(/LiteAdStore/gi, 'retail-Ad Store');
    content = content.replace(/LiteAd Store/gi, 'retail-Ad Store');
    content = content.replace(/©\s*2026\s*LiteAd(\s*Inc\.?)?\s*All rights reserved\./gi, '© 2026 nonlogi .Inc All rights reserved.');
    content = content.replace(/©\s*2026\s*LiteAd(\s*Inc\.?)?/gi, '© 2026 nonlogi .Inc');
    content = content.replace(/LiteAd Inc\.?/gi, 'nonlogi .Inc');
    
    // General LiteAd string
    content = content.replace(/LiteAd/g, 'retail-ad');
    // Catch litead domain/email parts
    content = content.replace(/litead\.demo\.jp/g, 'retail-ad.awsapps.com');
    content = content.replace(/litead/g, 'retail-ad');
    content = content.replace(/Litead/g, 'retail-ad');

    if(content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + file);
    }
});
console.log('Bulk replace completed!');
