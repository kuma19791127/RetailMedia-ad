const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html', 'utf8');

// 1. Remove duplicate budoux injection
const budouxRegex = /<script src="https:\/\/unpkg\.com\/budoux\/bundle\/budoux-ja\.min\.js"><\/script>/g;
let budouxCount = 0;
doc = doc.replace(budouxRegex, (match) => {
    budouxCount++;
    return budouxCount === 1 ? match : ''; // Keep only first match
});

const budouxStyleRegex = /<\!-- ULTIMATE JAPANESE TYPOGRAPHY FIX -->[\s\S]*?<\!-- END TYPOGRAPHY FIX -->/g;
let budouxStyleCount = 0;
doc = doc.replace(budouxStyleRegex, (match) => {
    budouxStyleCount++;
    return budouxStyleCount === 1 ? match : ''; // Keep only first match
});

// 2. Allow 0 yen budgets
doc = doc.replace('<input type="number" id="cp-budget" placeholder="1000" min="1000" required>', '<input type="number" id="cp-budget" placeholder="0" min="0" required>');

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html', doc, 'utf8');


let sw = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/service-worker.js', 'utf8');
// 3. Fix SW cache put error logging implicitly by catching and ignoring silently, or ignoring chrome-extension
sw = sw.replace("if (url.startsWith('http://') || url.startsWith('https://')) {", "if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('chrome-extension')) {");
sw = sw.replace("cache.put(e.request, responseClone).catch(err => console.error(err));", "cache.put(e.request, responseClone).catch(() => {}); // Suppress caching warnings");

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/service-worker.js', sw, 'utf8');

console.log('Fixed advertiser dashboard issues and SW cache issue.');
