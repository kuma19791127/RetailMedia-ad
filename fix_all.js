const fs = require('fs');

// 1. store_portal.html
let storeHtml = fs.readFileSync('store_portal.html', 'utf8');
storeHtml = storeHtml.replace(
    /<i>✨<\/i><span>AIボイススタジオ<\/span>[\s\S]*?<\/a>/g, 
    match => match + '\n            <a href=\"anywhere_lp.html\" class=\"nav-item\" target=\"_blank\">\n                <i class="fa-solid fa-cash-register"></i><span>どこでもレジ (LP)</span>\n            </a>'
);
fs.writeFileSync('store_portal.html', storeHtml);

// 2. manualhelp.html
let manualHtml = fs.readFileSync('manualhelp.html', 'utf8');
if (!manualHtml.includes('overflow-x: hidden')) {
    manualHtml = manualHtml.replace('body {', 'body {\n            overflow-x: hidden;\n            max-width: 100vw;\n            box-sizing: border-box;');
}
fs.writeFileSync('manualhelp.html', manualHtml);

// 3. shift_manager.html
let shiftHtml = fs.readFileSync('shift_manager.html', 'utf8');
if (!shiftHtml.includes('overflow-x: hidden')) {
    shiftHtml = shiftHtml.replace(/body\s*\{/, 'body {\n            overflow-x: hidden;\n            max-width: 100vw;\n            box-sizing: border-box;');
}
fs.writeFileSync('shift_manager.html', shiftHtml);

// 4. shift_manager_lp.html
let lp = fs.readFileSync('shift_manager_lp.html', 'utf8');
lp = lp.replace(/<span class=\"nw\">コピーして、AIがスタッフの希望チャットを読み取り、<\/span>/g, '<span class=\"nw\">コピーして、AIがスタッフの<\/span><br class=\"mobile-br\">\\n            <span class=\"nw\">希望チャットを読み取り、<\/span>');
lp = lp.replace(/<span class=\"nw\">そのまま管理画面からアップロードするだけで、<\/span>/g, '<span class=\"nw\">そのまま管理画面から<\/span><br class=\"mobile-br\"><span class=\"nw\">アップロードするだけで、<\/span>');
lp = lp.replace(/<span class=\"nw\">AIが自動解析しWebシステムに完全移行させます。<\/span>/g, '<span class=\"nw\">AIが自動解析しWebシステムに<\/span><br class=\"mobile-br\"><span class=\"nw\">完全移行させます。<\/span>');
lp = lp.replace(/<span class=\"nw\">まるで店長にLINEを送るような感覚で<\/span><br class=\"mobile-br\">\s*<span class=\"nw\">希望を伝えるだけ。<\/span>/g, '<span class=\"nw\">まるで店長にLINEを送るような<\/span><br class=\"mobile-br\">\\n                    <span class=\"nw\">感覚でチャットで希望を<\/span><br class=\"mobile-br\">\\n                    <span class=\"nw\">伝えるだけ。<\/span>');
lp = lp.replace(/<span class=\"nw\">シフト表に「休み\(休\)」や「時短\(15:00-\)」として<\/span>/g, '<span class=\"nw\">シフト表に<\/span><br class=\"mobile-br\">\\n                    <span class=\"nw\">「休み(休)」や「時短(15:00-)」として<\/span>');
fs.writeFileSync('shift_manager_lp.html', lp);

console.log("All fixes applied!");
