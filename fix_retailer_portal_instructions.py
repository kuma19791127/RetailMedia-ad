with open('retailer_portal.html', 'r', encoding='utf-8') as f:
    text = f.read()

target_tab = '''        <div id="tab-store-setup" style="display:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom:20px;">
                <h1 style="border:none; padding:0; margin:0;">店舗サイネージのセットアップ発行</h1>
                <button onclick="switchTab('dashboard')" style="background:#64748b; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">戻る</button>
            </div>
            <div class="card">
                <h3>店舗への設定案内</h3>
                <p>店舗のサイネージパネル・モニターで動画を再生するための準備です。</p>
                <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin-top:15px;">
                    <p style="margin-top:0; font-weight:bold;">Androidアプリの初回起動時に入力するIDを発行します</p>
                    <p>貴社の企業ID（英数字）:</p>
                    <input type="text" id="retailer-prefix" value="demo" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:5px; background:#e2e8f0;" readonly>
                    <p>店舗番号または店舗名（英数字）:</p>
                    <input type="text" id="store-suffix" placeholder="例: shibuya-01" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #ccc; border-radius:5px;">
                    <button onclick="generateSetupInstructions()" style="background:#10b981; color:white; border:none; padding:12px 20px; border-radius:5px; font-weight:bold; cursor:pointer; flex:1;">📋 店舗への案内文（指示書）をコピーする</button>
                </div>
            </div>
        </div>'''

replacement_tab = '''        <div id="tab-store-setup" style="display:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom:20px;">
                <h1 style="border:none; padding:0; margin:0;">店舗サイネージのセットアップ発行</h1>
                <button onclick="switchTab('dashboard')" style="background:#64748b; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">戻る</button>
            </div>
            <div class="card">
                <h3>店舗への設定案内</h3>
                <p>店舗のサイネージパネル・モニターで動画を再生するための準備です。</p>

                <p style="font-size:0.85rem; color:#34495e; line-height:1.6; background: #ecfdf5; padding: 15px; border-radius: 6px; margin-top: 10px;">
                  <strong style="color: #047857;">💡 停電時の自動復旧について</strong><br>
                  Androidアプリ「RetailMedia Signage」は、端末起動時に自動で立ち上がる設定が可能です。<br>
                  そのため停電などで電源が落ちた場合でも、電気が復旧して端末が再起動されれば、<br>
                  スタッフが一切操作をしなくても自動的にサイネージの放映が自動再開されます。
                </p>

                <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin-top:15px;">
                    <ol style="margin:0; padding-left:20px; line-height:1.8; color:#334155;">
                        <li><span style="font-weight:bold; color:#e74c3c;">必ずサイネージパネル（Android端末）をWi-Fi等のインターネットに接続してください。</span><br>
                            <span style="font-size:0.8rem; color:#64748b;">※USBやSDカードのみで運用する「オフライン専用サイネージパネル」ではご利用できません。</span></li>
                        <li>専用のダウンロードリンクから<br>
                            <strong>「RetailMedia Signage」</strong> アプリ（APKファイル）をインストールします。<br>
                            <button onclick="sendDownloadLink()" style="margin-top:10px; margin-bottom:10px; background:#3b82f6; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">📧 アプリのダウンロードリンクを送信する</button>
                        </li>
                        <li>アプリを起動するだけで完了です！自動で全画面表示になり、クラウドから最新の広告動画がループ再生されます。<br>
                            <span style="font-size:0.8rem; color:#64748b;">※端末の固有IDにより自動で店舗と紐付きます。面倒な設定作業は一切不要です！</span>
                        </li>
                    </ol>
                </div>
                
                <div style="margin-top:20px;">
                    <button onclick="generateSetupInstructions()" style="width:100%; background:#10b981; color:white; border:none; padding:12px 20px; border-radius:5px; font-weight:bold; cursor:pointer;">📋 店舗への案内文（指示書）をコピーする</button>
                </div>
            </div>
        </div>'''

text = text.replace(target_tab, replacement_tab)

target_script = '''        function generateSetupInstructions() {
            const suffix = document.getElementById('store-suffix').value.trim();
            if(!suffix) { Swal.fire("エラー", "店舗番号（または店舗名）を入力してください。", "error"); return; }
            
            const storeId = `${currentPrefix}_${suffix}`;
            const text = `【サイネージ初期設定のお願い】\\n\\n店舗のAndroidサイネージ端末（またはタブレット）にて、以下の設定をお願いします。\\n\\n1. Google Playストアより「Anywhere Retail (Signage)」アプリをインストールしてください。\\n2. アプリの初回起動時に、以下のIDを入力してログインしてください。\\n\\n■ 企業ID: ${currentPrefix}\\n■ 店舗ID: ${suffix}\\n\\n※設定完了後、数秒で自動的に広告・CMの放映がスタートします。電源を入れるだけで次回からは自動再生されます。`;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {'''

replacement_script = '''        function sendDownloadLink() {
            Swal.fire({
                title: 'メールアドレスを入力',
                input: 'email',
                inputPlaceholder: '店舗のメールアドレス',
                showCancelButton: true,
                confirmButtonText: '送信する',
                cancelButtonText: 'キャンセル'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire('送信完了', result.value + ' 宛にアプリのダウンロードリンクを送信しました。', 'success');
                }
            });
        }

        function generateSetupInstructions() {
            const text = `【サイネージ初期設定のお願い】\\n\\n店舗のサイネージパネル（Android端末）にて、以下の設定をお願いします。\\n※必ずWi-Fi等のインターネットに接続してください。USBやSDカードのみでのオフライン運用はできません。\\n\\n1. 配布された専用リンクから「RetailMedia Signage」アプリ（APKファイル）をインストールしてください。\\n2. アプリを起動するだけで初期設定は完了です。\\n（※自動で店舗と紐付くため、IDの入力等は不要です）\\n\\n※数秒で自動的に広告・CMの放映がスタートします。電源を入れるだけで次回からは自動再生され、停電時も自動復旧します。`;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {'''

text = text.replace(target_script, replacement_script)

with open('retailer_portal.html', 'w', encoding='utf-8') as f:
    f.write(text)
