const fs = require('fs');

let html = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/store_portal.html', 'utf8');

const setupSection = `
            <!-- Signage Auto Setup Action Panel -->
            <div class="card" style="margin-top:20px; border-left: 5px solid #e74c3c;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:20px;">
                    <div style="flex:1; min-width:300px;">
                        <h3 style="margin-top:0; color:#c0392b;">🛠️ サイネージ自動起動セットアップ（Windows専用）</h3>
                        <p style="font-size:0.95rem; color:#555; line-height:1.6;">
                            パソコン(サイネージパネル)の電源を入れると、自動的Chromeを全画面で表示するようにロジックを組んでいます。<br>
                            現場は「電源を入れるだけ」でカメラ設定も自動化され、広告事業が自動開始されます。
                        </p>
                        <div style="background:#f9ebea; padding:15px; border-radius:6px; margin-top:15px;">
                            <strong style="color:#c0392b;">【設定手順】</strong><br>
                            <span style="font-size:0.9rem; color:#333;">
                                1. 必ず実際の<strong style="color:#e74c3c; font-size:1rem;">サイネージパネル（放映するパソコン本体）</strong>のブラウザでこのボタンをクリックします。<br>
                                2. ダウンロードされた「setup_retail_signage.bat」をダブルクリックして実行します。<br>
                                3. 黒い画面が出たらエンターキーを押すと設定が完了します。
                            </span>
                        </div>
                        <p style="font-size:0.85rem; color:#7f8c8d; margin-top:10px;">
                            ※サイネージパネルで <a href="https://retail-ad.com/signage_player.html" target="_blank" style="color:#2980b9;">https://retail-ad.com/signage_player.html</a> が自動で立ち上がるようになります。<br>
                            ※全画面を強制的に手動で閉じたいときだけ、キーボードをつけて <b>Alt + F4</b> キーを押してください。
                        </p>
                    </div>
                    <div style="flex-basis: 250px; text-align:center;">
                        <a href="setup_retail_signage.bat" download style="display:inline-block; background:#e74c3c; color:white; padding:15px 25px; border-radius:8px; text-decoration:none; font-weight:bold; width:100%; box-sizing:border-box; margin-bottom:15px; box-shadow:0 4px 6px rgba(231,76,60,0.3);">
                            ⏬ セットアップ(bat)をDL
                        </a>
                        <div style="font-size:0.8rem; color:#666; text-align:left; border:1px solid #ddd; padding:10px; border-radius:4px;">
                            <span style="font-weight:bold;">間違って設定してしまった場合は：</span><br>
                            元の普通のパソコンに戻したいときは、こちらの解除ツールを実行してください。<br>
                            <a href="remove_retail_signage.bat" download style="color:#e74c3c; display:inline-block; margin-top:5px; font-weight:bold;">❌ 設定の削除(bat)をDL</a>
                        </div>
                    </div>
                </div>
            </div>
`;

if (!html.includes('Signage Auto Setup Action Panel')) {
    html = html.replace('<!-- AdManager / AdSense Integration Action Panel -->', setupSection + '\n            <!-- AdManager / AdSense Integration Action Panel -->');
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/store_portal.html', html, 'utf8');
    console.log('Successfully injected Setup section to store_portal.html!');
} else {
    console.log('Setup section already exists.');
}
