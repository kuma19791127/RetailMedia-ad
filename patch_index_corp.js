const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/index.html', 'utf8');

const newContent = `
    <!-- SECTION 2: SEO & Main Content -->
    <div id="about" class="section">
        <h1 style="font-size:2.5rem; text-align:center; color:var(--dark); margin-bottom:20px; line-height:1.4;">
            小売りの現場を<br class="mobile-br"><span class="nw">「利益を生むメディア」へ</span><br class="mobile-br">サイネージ広告システム<br class="mobile-br">『リテアド』
        </h1>
        <p style="text-align:center; font-size:1.2rem; color:var(--gray); margin-bottom:60px;">
            「10円単位の経費削減」に苦しむ<br class="mobile-br">
            小売りの現場を変えたい。<br class="mobile-br">
            サイネージとPOSを連携させた<br class="mobile-br">
            次世代リテールメディアプラットフォーム。
        </p>

        <h2 class="section-title">開発の背景と想い<br class="mobile-br">（なぜリテアドを作ったか）</h2>
        <p class="text-body">
            小売り・スーパーの現場は、<br class="mobile-br">
            日々10円単位で経費削減の<br class="mobile-br">
            努力を重ねています。<br>
            しかし現場の従業員はITに不慣れだったり、<br class="mobile-br">
            いまだに紙でマニュアル作成を行ったり、<br class="mobile-br">
            キャッシュレスに移行できない企業が<br class="mobile-br">
            数多く存在します。<br>
            <br>
            これは小売り業特有の「低利益率」が原因で、<br class="mobile-br">
            売り上げ以外の改善やDXに対して<br class="mobile-br">
            経営資源を投下するのを<br class="mobile-br">
            躊躇してしまっている現状があります。<br>
            <br>
            この「低利益」と「経営環境の改善」を<br class="mobile-br">
            両立できれば、業界全体のイメージを<br class="mobile-br">
            変えるキッカケになると思い、<br class="mobile-br">
            リテアドを開発しました。
        </p>

        <h2 class="section-title">リテアドの仕組みと<br class="mobile-br">提供する価値</h2>
        
        <h3 class="sub-title">1. サイネージ広告の共同運用</h3>
        <p class="text-body">
            違う会社・スーパー同士であっても、<br class="mobile-br">
            同じ広告事業を共同運営することで<br class="mobile-br">
            バラバラな仕組みを統一します。<br>
            窓口の一本化により、広告主は<br class="mobile-br">
            同じ地域・他店同士のネットワークへ<br class="mobile-br">
            横断的に広告を配信可能となります。
        </p>

        <h3 class="sub-title">2. リアルタイム・データ連携</h3>
        <p class="text-body">
            POSレジとの連携により、<br class="mobile-br">
            現場の売れ行きをリアルタイムに<br class="mobile-br">
            可視化できるAPIの仕組みを提供。<br>
            広告がどう売上に直結したのか<br class="mobile-br">
            確実な効果測定を実現します。
        </p>

        <h3 class="sub-title">3. 顧客と店舗へのメリット</h3>
        <p class="text-body">
            小売り企業はサイネージを設置するだけで<br class="mobile-br">
            新たな広告事業を始められ、<br class="mobile-br">
            すぐに収益改善の環境が整います。<br>
            一方、来店される顧客にはAIを利用した<br class="mobile-br">
            安売り告知などのお得な情報や、<br class="mobile-br">
            配信クリエイターによる料理レシピ、<br class="mobile-br">
            地元の情報配信などをお届け。<br>
            質の高いサイネージによって<br class="mobile-br">
            買い物中の数秒でも楽しんでいただける<br class="mobile-br">
            瞬間を提供します。
        </p>

        <h2 class="section-title">広告収益＋DX化<br class="mobile-br">（経営環境の劇的な改善へ）</h2>
        <p class="text-body">
            リテアドは広告配信にとどまらず、<br class="mobile-br">
            店舗のDX化を強力に後押しします。
        </p>
        <div class="highlight-box">
            <strong style="font-size:1.1rem; color:var(--dark);">基本無料で使える豊富なDXツール群</strong>
            <ul style="margin-top:10px;">
                <li><strong>マニュアル作成無料サービス:</strong> AI活用で動画やPDFを高速テキスト化。</li>
                <li><strong>店内アナウンスAI:</strong> 多言語対応の自動音声合成システム。</li>
                <li><strong>キャッシュレスレジのモバイル化:</strong> スタッフがスマホ一つで決済可能。</li>
                <li><strong>スマート・シフト生成:</strong> チャット送信などで一瞬でシフト作成完了。</li>
            </ul>
        </div>
        <p class="text-body">
            一部の外部API（有料サービス）を除き、<br class="mobile-br">
            これらのDX機能は**基本無料**で提供。<br class="mobile-br">
            リテアドにログインしていただくだけで、<br class="mobile-br">
            すぐにすべての環境を導入できます。
        </p>

        <h2 class="section-title">私たちの思想</h2>
        <p class="text-body" style="border-left:4px solid var(--primary); padding-left:15px; font-style:italic;">
            「自分の会社だけが良ければいい、<br class="mobile-br">
            というのは全く面白くない。」<br>
            <br>
            企業という組織であっても、<br class="mobile-br">
            その考え方を共有・運営することで<br class="mobile-br">
            世界が少しでも良くなると<br class="mobile-br">
            本気で考えております。<br class="mobile-br">
            それがこのプラットフォームの<br class="mobile-br">
            思想の根底にあります。
        </p>
    </div>

    <!-- Contact & Company Info -->
    <div id="contact" style="background: white; padding: 60px 20px; border-top: 1px solid #e2e8f0; text-align:center;">
        <h2 class="section-title">会社概要</h2>
        <div style="max-width:400px; margin: 0 auto; text-align:left; background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0; font-size:0.95rem; color:#334155;">
            <strong>会社名：</strong> non-logi株式会社<br>
            <strong>代表者：</strong> 代表取締役 熊澤 一<br>
            <strong>所在地：</strong> 神奈川県 横浜市<br>
            <strong>事業内容：</strong><br>
            ・AIサービス開発<br>
            ・インバウンド向けAIサービス開発<br>
            ・リテールメディアプラットフォーム運営
        </div>

        <h2 class="section-title" style="margin-top:50px;">お問い合わせ</h2>
        <p class="text-body" style="max-width: 600px; margin: 0 auto 30px;">
            リテアドの無料導入、店舗のDX化についてのご相談・お問い合わせはこちらから。
        </p>
        <a href="mailto:info@retail-ad.awsapps.com" style="display:inline-block; background:var(--primary); color:white; padding:15px 40px; border-radius:30px; font-weight:bold; text-decoration:none; font-size:1.1rem;">
            ✉️ 担当者へメールで問い合わせる
        </a>
        <p style="margin-top:15px; font-size:0.9rem; color:var(--gray);">info@retail-ad.awsapps.com</p>
    </div>

    <footer>
        <div style="font-size:20px; font-weight:bold; margin-bottom:20px; color:white;">retail-ad</div>
        <div style="margin-bottom:20px;">
            <a href="business_lp.html">店舗用ポータル (retail-Ad Store)</a> | 
            <a href="ad_dashboard-LP.html">広告主向け</a> | 
            <a href="agency_lp.html">代理店ポータル</a> | 
            <a href="creator_lp.html">クリエイター (retail-Ad Creator)</a>
        </div>
        <p style="color:#94a3b8; font-size:0.9rem; margin-bottom:10px;">
            <a href="about_retail_media.html" style="color:#94a3b8; text-decoration:underline;">リテールメディアに関するコラム</a> |<br><br>
            <a href="terms_of_service.html" style="color:#94a3b8; text-decoration:underline;">利用規約</a> | 
            <a href="privacy_policy.html" style="color:#94a3b8; text-decoration:underline;">プライバシーポリシー</a> | 
            <a href="commercial_law.html" style="color:#94a3b8; text-decoration:underline;">特定商取引法に基づく表記</a>
        </p>
        <p style="color:#64748b; font-size:0.8rem;">© 2026 non-logi .Inc All rights reserved.</p>
    </footer>\n`;

const startIndex = doc.indexOf('<!-- SECTION 2: SEO & Main Content -->');
const endIndex = doc.indexOf('<script>');

if (startIndex !== -1 && endIndex !== -1) {
    const newDoc = doc.substring(0, startIndex) + newContent + doc.substring(endIndex);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/index.html', newDoc, 'utf8');
    console.log('Successfully updated index.html with new Corporate / Concept copy.');
} else {
    console.log('Failed to find replace boundaries.', startIndex, endIndex);
}
