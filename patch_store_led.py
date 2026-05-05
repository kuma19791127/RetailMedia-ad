import re

fp = 'c:/Users/one/Desktop/RetailMedia_System/store_portal.html'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the entire "Signage Auto Setup Action Panel" block
new_panel = """
            <!-- Signage Auto Setup Action Panel -->
            <div class="card" style="margin-top:20px; border-left: 5px solid #e74c3c;">
                <h3 style="margin-top:0; color:#c0392b;">🛠️ サイネージ自動起動セットアップ（Windows専用）</h3>
                <p style="font-size:0.95rem; color:#555; line-height:1.6;">
                    現場スタッフが「電源を入れるだけ」でサイネージが全画面で自動スタートし、広告事業が開始されるように設定します。
                </p>
                <div style="background:#f9ebea; padding:15px; border-radius:6px; margin-top:15px; margin-bottom: 20px;">
                    <strong style="color:#c0392b;">【共通の設定手順】</strong><br>
                    <span style="font-size:0.9rem; color:#333;">
                        <span style="font-weight:bold; color:#e74c3c;">0. 必ずサイネージパネルをWi-Fiなどのインターネットに接続してください。</span><br>
                        <span style="font-size:0.8rem; color:#666; margin-bottom:5px; display:inline-block;">※USBやSDカードのみで運用する「オフライン専用サイネージパネル」ではご利用できません。</span><br>
                        1. 実際の<strong style="color:#e74c3c; font-size:1rem;">サイネージパネル（放映するパソコン本体）</strong>のブラウザでこの画面を開き、対象のセットアップツールをダウンロードします。<br>
                        2. ダウンロードされた「.bat」ファイルをダブルクリックして実行します。<br>
                        3. ダブルクリックするだけで一瞬で設定が完了し、自動的にテスト用のサイネージ画面が全画面で立ち上がります。
                    </span>
                </div>

                <!-- Normal Signage -->
                <div style="border:1px solid #ddd; padding:15px; border-radius:8px; margin-bottom:15px;">
                    <h4 style="margin-top:0; color:#2980b9;">📺 通常のサイネージパネル・モニター用</h4>
                    <p style="font-size:0.85rem; color:#666;">一般的な16:9のテレビや液晶モニターを使用する場合はこちら。</p>
                    <a href="setup_retail_signage.bat" download style="display:inline-block; background:#2980b9; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold; box-shadow:0 4px 6px rgba(41,128,185,0.3);">
                        ⏬ 通常版セットアップ(bat)をDL
                    </a>
                </div>

                <!-- LED Film -->
                <div style="border:1px solid #ddd; padding:15px; border-radius:8px; margin-bottom:15px;">
                    <h4 style="margin-top:0; color:#8e44ad;">💡 LEDフィルム・特殊形状サイネージ用</h4>
                    <p style="font-size:0.85rem; color:#666;">LEDフィルムなど、特定の解像度で出力する必要がある場合は、対象のサイズを選んでダウンロードしてください。</p>
                    
                    <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">
                        <div style="flex:1; min-width:200px; background:#f4f6f7; padding:10px; border-radius:6px; text-align:center;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:0.9rem;">🐟 鮮魚対面ガラス用</div>
                            <div style="font-size:0.75rem; color:#7f8c8d; margin-bottom:8px;">1000 × 300mm<br>(シズル感の演出・調理法提案)</div>
                            <a href="setup_led_fish.bat" download style="display:block; background:#8e44ad; color:white; padding:8px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:0.8rem;">⏬ ダウンロード</a>
                        </div>
                        <div style="flex:1; min-width:200px; background:#f4f6f7; padding:10px; border-radius:6px; text-align:center;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:0.9rem;">🥶 冷蔵庫ドア用</div>
                            <div style="font-size:0.75rem; color:#7f8c8d; margin-bottom:8px;">500 × 1000mm<br>(銘柄訴求・セット買い促進)</div>
                            <a href="setup_led_fridge.bat" download style="display:block; background:#8e44ad; color:white; padding:8px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:0.8rem;">⏬ ダウンロード</a>
                        </div>
                        <div style="flex:1; min-width:200px; background:#f4f6f7; padding:10px; border-radius:6px; text-align:center;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:0.9rem;">🛒 エンド上部用</div>
                            <div style="font-size:0.75rem; color:#7f8c8d; margin-bottom:8px;">900 × 200mm<br>(コーナーの視認性アップ)</div>
                            <a href="setup_led_endcap.bat" download style="display:block; background:#8e44ad; color:white; padding:8px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:0.8rem;">⏬ ダウンロード</a>
                        </div>
                        <div style="flex:1; min-width:200px; background:#f4f6f7; padding:10px; border-radius:6px; text-align:center;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:0.9rem;">🏷️ 棚割り（定番棚）用</div>
                            <div style="font-size:0.75rem; color:#7f8c8d; margin-bottom:8px;">900 × 100mm<br>(電子棚札＋動画広告)</div>
                            <a href="setup_led_shelf.bat" download style="display:block; background:#8e44ad; color:white; padding:8px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:0.8rem;">⏬ ダウンロード</a>
                        </div>
                    </div>
                </div>

                <div style="font-size:0.8rem; color:#666; text-align:left; border:1px solid #ddd; padding:10px; border-radius:4px; margin-top:15px;">
                    <span style="font-weight:bold;">間違って設定してしまった場合は：</span><br>
                    元の普通のパソコンに戻したいときは、こちらの解除ツールを実行してください。<br>
                    <a href="remove_retail_signage.bat" download style="color:#e74c3c; display:inline-block; margin-top:5px; font-weight:bold;">❌ 設定の削除(bat)をDL</a>
                </div>
            </div>
            <!-- AdManager -->"""

# We need to extract what to replace.
# It starts at: <!-- Signage Auto Setup Action Panel -->
# It ends right before: <!-- AdManager / AdSense Integration Action Panel -->
content = re.sub(
    r'<!-- Signage Auto Setup Action Panel -->.*?<!-- AdManager', 
    new_panel + '\n            <!-- AdManager', 
    content, 
    flags=re.DOTALL
)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated store_portal.html with split setup files")
