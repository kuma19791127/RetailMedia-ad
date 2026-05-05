const fs = require('fs');

let text = fs.readFileSync('manualhelp_lp.html', 'utf8');

// Also update the global BudouX typography tags to the standard format
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

// 1. 月100 / 万円費用を
text = text.replace(
    '<h1>マニュアル作成に月100万円費用を<br>支払っていませんか？</h1>',
    '<h1><span class="nw">マニュアル作成に</span><br class="mobile-br"><span class="nw">月100万円費用を</span><br><span class="nw">支払っていませんか？</span></h1>'
);

// 2. 「いくらでも」「無料で」「次世代マニュアル」「ドラッグ＆ドロップ」「圧倒的なDX」
text = text.replace(
    '<p class="hero-subtitle">ManualHelpは「何人でも」「いくらでも」無料で使える次世代マニュアル管理プラットフォームです。<br>動画のAI解析、ドラッグ＆ドロップによる直感的な編集で圧倒的なDXを実現します。</p>',
    '<p class="hero-subtitle"><span class="nw">ManualHelpは「何人でも」</span><br class="mobile-br"><span class="nw">「いくらでも」</span><span class="nw">無料で使える</span><br class="mobile-br"><span class="nw">次世代マニュアル管理プラットフォームです。</span><br><span class="nw">動画のAI解析、</span><br class="mobile-br"><span class="nw">ドラッグ＆ドロップによる直感的な編集で</span><br class="mobile-br"><span class="nw">圧倒的なDXを実現します。</span></p>'
);

// 3. 「無料」です / 【AI一括多言語翻訳】 / 1回500円
text = text.replace(
    '<div class="pricing-text">基本機能はすべて「無料」です</div>',
    '<div class="pricing-text"><span class="nw">基本機能はすべて</span><br class="mobile-br"><span class="nw">「無料」です</span></div>'
);
text = text.replace(
    '<p class="pricing-note">※Google Cloud APIを利用した【AI動画解析】や【AI一括多言語翻訳】などの特殊機能をご利用の際のみ、1回500円の実費決済となります。</p>',
    '<p class="pricing-note"><span class="nw">※Google Cloud APIを利用した</span><span class="nw">【AI動画解析】や</span><br class="mobile-br"><span class="nw">【AI一括多言語翻訳】などの特殊機能をご利用の際のみ、</span><br class="mobile-br"><span class="nw">1回500円の実費決済となります。</span></p>'
);

// 4. 「現場のリアルな課題」
text = text.replace(
    '<h2 class="section-title">あらゆる業種の「現場のリアルな課題」を解決</h2>',
    '<h2 class="section-title"><span class="nw">あらゆる業種の</span><br class="mobile-br"><span class="nw">「現場のリアルな課題」を解決</span></h2>'
);

// 5. 製造業
text = text.replace(
    '<div class="industry-desc">複雑な機械操作や安全基準の共有。PDFの取り扱い説明書をアップロードするだけで自動階層化し、言語の違う外国人労働者へ一括翻訳して安全を担保。</div>',
    '<div class="industry-desc"><span class="nw">複雑な機械操作や安全基準の共有。</span><br class="mobile-br"><span class="nw">PDFの取り扱い説明書をアップロードするだけで自動階層化し、</span><br class="mobile-br"><span class="nw">言語の違う外国人労働者へ一括翻訳して安全を担保。</span></div>'
);

// 6. 情報通信業
text = text.replace(
    '<div class="industry-desc">複雑な社内システムの利用手順を画面録画動画から一瞬で文章化。エンジニアのドキュメント作成の時間をゼロに。</div>',
    '<div class="industry-desc"><span class="nw">複雑な社内システムの利用手順を画面録画動画から一瞬で文章化。</span><br class="mobile-br"><span class="nw">エンジニアのドキュメント作成の時間をゼロに。</span></div>'
);

// 7. 飲食サービス業
text = text.replace(
    '<div class="industry-desc">レシピや仕込みの手順、接客の基本をビジュアル化。動画共有機能により、各店舗間での品質のばらつきや属人化を完全に排除！</div>',
    '<div class="industry-desc"><span class="nw">レシピや仕込みの手順、接客の基本を</span><br class="mobile-br"><span class="nw">ビジュアル化。</span><span class="nw">動画共有機能により、</span><br class="mobile-br"><span class="nw">各店舗間での品質のばらつきや</span><br class="mobile-br"><span class="nw">属人化を完全に排除！</span></div>'
);

// 8. 医療
text = text.replace(
    '<div class="industry-desc">ミスの許されない器具の扱いや介助手順。チャット機能での「申し送り事項」との連動でスムーズな業務引継ぎを実現します。</div>',
    '<div class="industry-desc"><span class="nw">ミスの許されない器具の扱いや介助手順。</span><br class="mobile-br"><span class="nw">チャット機能での「申し送り事項」との</span><br class="mobile-br"><span class="nw">連動でスムーズな業務引継ぎを実現します。</span></div>'
);

// 9. サービス業全般
text = text.replace(
    '<div class="industry-desc">「何を聞かれているか」事前のDM・チャット機能で情報共有。マニュアルとコミュニケーションを連携した新時代の教育システム。</div>',
    '<div class="industry-desc"><span class="nw">「何を聞かれているか」</span><br class="mobile-br"><span class="nw">事前のDM・チャット機能で情報共有。</span><br class="mobile-br"><span class="nw">マニュアルとコミュニケーションを連携した新時代の教育システム。</span></div>'
);

fs.writeFileSync('manualhelp_lp.html', text);
