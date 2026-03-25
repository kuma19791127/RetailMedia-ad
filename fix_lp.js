const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\one\\Desktop\\RetailMedia_System';

// --- 1. advertiser_lp.html のエンゲージメント削除 ---
const lpPath = path.join(dir, 'advertiser_lp.html');
if (fs.existsSync(lpPath)) {
    let html = fs.readFileSync(lpPath, 'utf8');
    // CPM型のカード部分をもれなく削除 (改行含む)
    const regex = /<div class="card">\s*<div class="icon">👁️<\/div>\s*<h3>エンゲージメント向上 \(CPM型\)<\/h3>\s*<p>AIカメラで「見られた数」を正確に計測。1,000回視認あたりの課金で、確実な認知拡大を実現します。<\/p>\s*<\/div>/g;
    html = html.replace(regex, '');
    fs.writeFileSync(lpPath, html, 'utf8');
    console.log('✅ advertiser_lp.html のエンゲージメント項目を削除しました。');
}

// --- 2. ad_dashboard-LP.html への文章追加 ---
const adLpPath = path.join(dir, 'ad_dashboard-LP.html');
if (fs.existsSync(adLpPath)) {
    let html = fs.readFileSync(adLpPath, 'utf8');
    
    // <section id="comparison" class="section"> の直前に新しいセクションを挿入
    const insertPoint = /<section id="comparison" class="section">/;
    const newSection = `
    <!-- POS Data Integration Benefits (New) -->
    <section class="section" style="background: rgba(15, 23, 42, 0.6); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);">
        <h2 class="section-title" style="font-size: 2.2rem; margin-bottom: 20px;">圧倒的な「POS連動・分析レポート」</h2>
        <p style="text-align:center; color:#cbd5e1; margin-bottom: 50px; font-size: 1.15rem; max-width: 800px; margin-left: auto; margin-right: auto;">
            リテアドであれば、広告主に対して以下のような強力なレポートを提示できます。
        </p>
        
        <div class="grid">
            <div class="card" style="border-top: 4px solid #f43f5e;">
                <h3 style="color: #f43f5e; font-size:1.3rem;">📊 A/Bテストによる純粋な効果測定</h3>
                <p>「A店舗群（広告を配信した店舗）」と「B店舗群（配信しなかった似た条件の店舗）」のPOSデータを比較し、<strong style="color:white;">広告を出した店舗の方が、対象商品の売上が統計的に有意に15%高かった</strong>ことなどを証明できます。</p>
            </div>
            
            <div class="card" style="border-top: 4px solid #34d399;">
                <h3 style="color: #34d399; font-size:1.3rem;">🛒 併売・クロスセル分析</h3>
                <p>「カレールーの広告を流した結果、カレールーだけでなく、玉ねぎや牛肉などの<strong style="color:white;">同時購入率（バスケット内の併売率）が普段より何%アップしたか</strong>」といったリフトアップ効果をPOSデータで統計分析します。</p>
            </div>
            
            <div class="card" style="border-top: 4px solid #60a5fa;">
                <h3 style="color: #60a5fa; font-size:1.3rem;">🥇 1st Party Dataの圧倒的優位</h3>
                <p>不透明なWeb上のCookieに頼らず、<strong>「実店舗のPOSデータ（絶対に嘘をつかない確定された購買データ）」</strong>と直接連携できることは、当メディア最大の差別化要因です。</p>
            </div>
        </div>
    </section>

    <section id="comparison" class="section">`;
    
    // まだ追加されていなければ追加
    if (!html.includes('圧倒的な「POS連動・分析レポート」')) {
        html = html.replace(insertPoint, newSection);
        fs.writeFileSync(adLpPath, html, 'utf8');
        console.log('✅ ad_dashboard-LP.html にPOS連動の強み（A/Bテスト等）を追加しました。');
    } else {
        console.log('⚠️ すでに ad_dashboard-LP.html に追加済みです。');
    }
}
