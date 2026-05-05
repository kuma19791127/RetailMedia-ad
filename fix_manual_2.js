const fs = require('fs');

let text = fs.readFileSync('manualhelp_lp.html', 'utf8');

// 1. 新時代を文頭に
text = text.replace(
    '<span class="nw">マニュアルとコミュニケーションを連携した新時代の教育システム。</span></div>',
    '<span class="nw">マニュアルとコミュニケーションを連携した</span><br class="mobile-br"><span class="nw">新時代の教育システム。</span></div>'
);

// 2. 「ダイレクトチャット機能」を文頭に
text = text.replace(
    '<h2 style="font-size: 2rem; margin-bottom: 20px;"><i class="fa-regular fa-comments"></i> 現場を繋ぐ「ダイレクトチャット機能」を標準搭載</h2>',
    '<h2 style="font-size: 2rem; margin-bottom: 20px;"><span class="nw"><i class="fa-regular fa-comments"></i> 現場を繋ぐ</span><br class="mobile-br"><span class="nw">「ダイレクトチャット機能」を標準搭載</span></h2>'
);

// 3. 共有可能ですを文頭に
text = text.replace(
    '万が一現場で問題が発生した場合も、画像や動画を添付して即座に全体や担当者へ共有可能です。',
    '<span class="nw">万が一現場で問題が発生した場合も、</span><br class="mobile-br"><span class="nw">画像や動画を添付して即座に全体や担当者へ</span><br class="mobile-br"><span class="nw">共有可能です。</span>'
);

fs.writeFileSync('manualhelp_lp.html', text);
