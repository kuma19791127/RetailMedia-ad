const fs = require('fs');

let text = fs.readFileSync('shift_manager_lp.html', 'utf8');

text = text.replace(/body\s*\{[\s\S]*?line-height:\s*1\.6;\s*overflow-x:\s*hidden;\s*\}/, 
`body {
            margin: 0;
            font-family: 'Inter', 'Noto Sans JP', sans-serif;
            background: var(--light);
            color: var(--dark);
            line-height: 1.6;
            overflow-x: hidden;
            word-wrap: break-word; /* Safe fallback */
        }`);

text = text.replace(/<!-- Global Mobile Typography Fix -->[\s\S]*?<!-- END TYPOGRAPHY FIX -->/,
`<!-- Unified Typography Fix -->
    <style>
        /* Force break blocks */
        .nw { display: inline-block; }
        .mobile-br { display: none; }
        .desktop-br { display: block; }
        
        @media (max-width: 768px) {
            .mobile-br { display: block; }
            .desktop-br { display: none; }
            
            h1 { font-size: clamp(1.6rem, 7vw, 2.2rem) !important; line-height: 1.4 !important; }
            h2 { font-size: clamp(1.4rem, 6vw, 1.8rem) !important; line-height: 1.5 !important; }
            h3 { font-size: clamp(1.2rem, 5vw, 1.5rem) !important; line-height: 1.4 !important; }

            .feature-image { min-height: 200px; font-size: 4rem; padding: 15px; }
            .feature-text p { word-break: break-all; } /* Further guarantee no cutoff */
        }
    </style>
    <!-- BudouX for Japanese Typography -->
    <script src="https://unpkg.com/budoux/bundle/budoux-ja.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof budoux !== 'undefined') {
                const parser = budoux.loadDefaultJapaneseParser();
                document.querySelectorAll('h1, h2, h3, p, .subtitle, li').forEach(el => {
                    parser.applyToElement(el);
                });
            }
        });
    </script>
    <!-- END TYPOGRAPHY FIX -->`);

// String replacements for STEP 1
text = text.replace('「新しいシステムを入れると、今までのシフト表から移行するのが大変…」<br>', '<span class="nw">「新しいシステムを入れると、</span><span class="nw">今までのシフト表から移行するのが大変…」</span><br>');
text = text.replace('そんな悩みは不要です。現在店長が使っているExcelのシフト表を、そのまま管理画面からアップロードするだけで、AIが自動解析しWebシステムに完全移行させます。', '<span class="nw">そんな悩みは不要です。</span><span class="nw">現在店長が使っているExcelのシフト表を、</span><br class="mobile-br"><span class="nw">そのまま管理画面からアップロードするだけで、</span><br class="mobile-br"><span class="nw">AIが自動解析しWebシステムに完全移行させます。</span>');

// String replacements for STEP 2
text = text.replace('「23日休みたいです」「来週の水曜日は15時上がりで！」<br>', '<span class="nw">「23日休みたいです」</span><span class="nw">「来週の水曜日は15時上がりで！」</span><br>');
text = text.replace('スタッフは専用のチャット画面（スマホ）から、まるで店長にLINEを送るような感覚で<br class="mobile-br">\n                    希望を伝えるだけ。<br>', '<span class="nw">スタッフは専用のチャット画面（スマホ）から、</span><span class="nw">まるで店長にLINEを送るような感覚で</span><br class="mobile-br">\n                    <span class="nw">希望を伝えるだけ。</span><br>');
text = text.replace('AIがそれを自動で読み取り、シフト表に「休み(休)」や「時短(15:00-)」として<br class="mobile-br">\n                    リアルタイムに反映させます。店長の転記作業はゼロになります。', '<span class="nw">AIがそれを自動で読み取り、</span><span class="nw">シフト表に「休み(休)」や「時短(15:00-)」として</span><br class="mobile-br">\n                    <span class="nw">リアルタイムに反映させます。</span><span class="nw">店長の転記作業はゼロになります。</span>');

// String replacements for STEP 3
text = text.replace('紙に印刷してバックヤードに貼り出す時代は終わりました。<br>', '<span class="nw">紙に印刷して</span><span class="nw">バックヤードに貼り出す時代は終わりました。</span><br>');
text = text.replace('AIによって完成されたシフトカレンダーは、スタッフ全員のスマートフォンからいつでも確認可能。毎日の勤務時間や、同僚の出勤状況も一目でわかります。', '<span class="nw">AIによって完成されたシフトカレンダーは、</span><br class="mobile-br"><span class="nw">スタッフ全員のスマートフォンからいつでも確認可能。</span><br><span class="nw">毎日の勤務時間や、同僚の出勤状況も一目でわかります。</span>');

// Also fix the main hero text
text = text.replace('既存のExcelファイルを<br class="mobile-br">\n            そのままアップロード！<br>\n            設定したマクロを読み取り、<br class="mobile-br">\n            コピーしてAIがスタッフの希望チャットを<br class="mobile-br">\n            読み取り、最適なシフトカレンダーを自動編成します。', 
'<span class="nw">既存のExcelファイルを</span><br class="mobile-br">\n            <span class="nw">そのままアップロード！</span><br>\n            <span class="nw">設定したマクロを読み取り、</span><br class="mobile-br">\n            <span class="nw">コピーして、AIがスタッフの希望チャットを読み取り、</span><br class="mobile-br">\n            <span class="nw">最適なシフトカレンダーを自動編成します。</span>');

fs.writeFileSync('shift_manager_lp.html', text);
