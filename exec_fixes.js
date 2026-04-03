const fs = require('fs');

try {
    let lp = fs.readFileSync('shift_manager_lp.html', 'utf8');
    lp = lp.replace(/<span class="nw">コピーして、AIがスタッフの希望チャットを読み取り、<\/span>/, '<span class="nw">コピーして、AIがスタッフの</span><br class="mobile-br">\n            <span class="nw">希望チャットを読み取り、</span>');
    lp = lp.replace(/<span class="nw">そのまま管理画面からアップロードするだけで、<\/span>/, '<span class="nw">そのまま管理画面から</span><br class="mobile-br">\n<span class="nw">アップロードするだけで、</span>');
    lp = lp.replace(/<span class="nw">AIが自動解析しWebシステムに完全移行させます。<\/span>/, '<span class="nw">AIが自動解析しWebシステムに</span><br class="mobile-br">\n<span class="nw">完全移行させます。</span>');
    lp = lp.replace(/<span class="nw">まるで店長にLINEを送るような感覚で<\/span>\s*<br class="mobile-br">\s*<span class="nw">希望を伝えるだけ。<\/span>/, '<span class="nw">まるで店長にLINEを送るような</span><br class="mobile-br">\n                    <span class="nw">感覚でチャットで希望を</span><br class="mobile-br">\n                    <span class="nw">伝えるだけ。</span>');
    lp = lp.replace(/<span class="nw">シフト表に「休み\(休\)」や「時短\(15:00-\)」として<\/span>/, '<span class="nw">シフト表に</span><br class="mobile-br">\n                    <span class="nw">「休み(休)」や「時短(15:00-)」として</span>');
    fs.writeFileSync('shift_manager_lp.html', lp);
    console.log('Fixed shift_manager_lp.html');
} catch(e) { console.error('Error shifting lp:', e); }

try {
    let mh = fs.readFileSync('manualhelp.html', 'utf8');
    mh = mh.replace(/<style>/i, '<style>\n        html, body { overflow-x: hidden !important; max-width: 100vw !important; width: 100vw; }\n        * { max-width: 100vw; box-sizing: border-box !important; }\n');
    if (!mh.includes('input, textarea, select { max-width: 100%;')) {
        mh = mh.replace('input, textarea, select {', 'input, textarea, select { max-width: 100%;');
    }
    fs.writeFileSync('manualhelp.html', mh);
    console.log('Fixed manualhelp.html');
} catch(e) { console.error('Error manualhelp:', e); }

try {
    let sm = fs.readFileSync('shift_manager.html', 'utf8');
    if (!sm.includes('html, body { overflow-x: hidden !important;')) {
        sm = sm.replace(/<style>/i, '<style>\n        html, body { overflow-x: hidden !important; max-width: 100vw !important; width: 100vw; }\n        * { box-sizing: border-box !important; max-width: 100vw; }\n');
    }
    fs.writeFileSync('shift_manager.html', sm);
    console.log('Fixed shift_manager.html');
} catch(e) { console.error('Error shift manager:', e); }
