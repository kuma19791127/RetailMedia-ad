const fs = require('fs');

let html = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html', 'utf8');

const cpmCard = `
                <!-- CPM -->
                <div class="card" onclick="openNewCampaignModal('cpm')"
                    style="cursor:pointer; border-left: 5px solid #e74c3c; background:#fff; padding:15px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s;">
                    <h3 style="margin-top:0; font-size:15px; color:#c0392b; margin-bottom: 5px;">📢 1. エンゲージメント配信<br><span style="font-size:12px;">（CPV: 約2円〜）</span></h3>
                    <p style="font-size: 11px; color: #7f8c8d; margin-top:0; line-height:1.4;">ブランドの認知度やエンゲージメントを最大化したい場合に最適なプランです。</p>
                    <div style="background:#f9ebea; padding:8px; border-radius:6px; margin-top:10px;">
                        <p style="font-size: 10px; color: #c0392b; margin:0; line-height:1.4;">※ 1,000円の消化イメージ: 約500回の完全視聴を獲得できます。</p>
                    </div>
                </div>`;

if (!html.includes('エンゲージメント配信')) {
  html = html.replace('<!-- Impression -->', cpmCard + '\n                <!-- Impression -->');
  html = html.replace('1. インプレッション配信', '2. インプレッション配信');
  html = html.replace('2. モーメント配信', '3. モーメント配信');
  html = html.replace('3. POS連動・成果報酬', '4. POS連動・成果報酬');
  fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html', html, 'utf8');
}
console.log('Added CPM card');
