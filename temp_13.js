async function initiateCampaign(plan) {

            // === KYC Authorization Gate ===
            const isDemoUser = window.currentUser && window.currentUser.email && window.currentUser.email.includes('@demo.com');
            const minBudgetNum = isDemoUser ? 0 : 1000;
            const isRealUser = window.currentUser && window.currentUser.email && window.currentUser.email !== 'Guest' && window.currentUser.email !== 'Unknown';
            if (isRealUser && !isDemoUser) {
                const kycStatus = localStorage.getItem('retail_kyc_approved');
                if (kycStatus !== 'true') {
                    Swal.fire({
                        title: '⚠️ 審査が未完了です',
                        html: '<span style="font-size:0.95rem;">広告を配信・アップロードするには、<b>プロフィール設定（本人・法人確認）</b>を完了する必要があります。<br><br><span style="color:#ef4444;">※現在、運営(Review)で許可されていないため配信できません。</span></span>',
                        icon: 'warning',
                        confirmButtonText: 'プロフィール設定を開く',
                        showCancelButton: true,
                        cancelButtonText: '閉じる'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            if(typeof openAdvertiserProfileModal === 'function') openAdvertiserProfileModal();
                        }
                    });
                    return;
                }
            }
            // ==============================

            let title = 'キャンペーン設定';
            let extraFields = '';

            // Dynamic Form Fields based on Plan
            if (plan === 'moment') {
                title = '☔ モーメント配信設定';
                extraFields = `
                    <div style="background:#fffaf0; padding:10px; border-radius:6px; margin-bottom:10px;">
                        <label style="display:block; text-align:left; font-weight:bold; color:#d35400;">⚡ 配信トリガー条件</label>
                        <select id="swal-trigger" class="swal2-input" style="font-size:14px; margin-top:5px;">
                            <option value="rain">☔ 雨天時 (Rain)</option>
                            <option value="hot">☀️ 猛暑 (30℃+)</option>
                            <option value="cold">❄️ 寒冷 (10℃-)</option>
                            <option value="crowded">👥 混雑時 (High Traffic)</option>
                        </select>
                    </div>`;
            } else if (plan === 'impression') {
                title = '📈 インプレッション配信設定';
                extraFields = `
                    <div style="background:#f8f9fa; padding:10px; border-radius:6px; margin-bottom:10px;">
                        <label style="display:block; text-align:left; font-weight:bold; color:#8e44ad;">🎯 目標再生回数</label>
                        <input type="number" id="swal-target" class="swal2-input" value="10000" placeholder="10000" style="margin-top:5px;">
                    </div>`;
            } else if (plan === 'cpa') {
                title = '🛒 成果報酬型キャンペーン設定';
                extraFields = `
                    <div style="background:#f0fff4; padding:10px; border-radius:6px; margin-bottom:10px;">
                        <label style="display:block; text-align:left; font-weight:bold; color:#27ae60;">💰 目標CPA (獲得単価)</label>
                        <input type="number" id="swal-cpa-target" class="swal2-input" placeholder="例: 500" style="margin-top:5px;">
                    </div>`;
            }


            // Common Targeting Fields (New Request)
            const storeSearchFields = `
                <div style="text-align:left; margin-top:10px; border-top:1px dashed #ddd; padding-top:10px;">
                    <label style="font-size:12px; font-weight:bold; color:#555;">📍 エリア・パネル指定 (任意)</label>
                    <div style="display:flex; gap:5px; margin-top:5px; margin-bottom:10px;">
                        <input id="swal-store-search" class="swal2-input" placeholder="店舗名や地域を入力 (例: 横浜市)" style="margin:0; font-size:14px; flex:1;">
                        <button type="button" onclick="searchStores()" style="background:#2ecc71; color:white; border:none; padding:0 15px; border-radius:4px; font-weight:bold; cursor:pointer;">検索</button>
                    </div>
                    <div id="swal-store-results" style="max-height:100px; overflow-y:auto; font-size:12px; background:#f8f9fa; border:1px solid #eee; border-radius:4px; display:none;"></div>
                </div>
            `;
            
            const targetingFields = `
                <div style="text-align:left; margin-top:10px; border-top:1px dashed #ddd; padding-top:10px;">
                    <label style="font-size:12px; font-weight:bold; color:#555;">🎯 ターゲティング設定 (任意)</label>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:5px;">
                        <select id="swal-gender" class="swal2-select" style="font-size:14px; margin:0; padding:8px;">
                            <option value="all">性別: 指定なし</option>
                            <option value="female">👩 女性</option>
                            <option value="male">👨 男性</option>
                        </select>
                        <select id="swal-age" class="swal2-select" style="font-size:14px; margin:0; padding:8px;">
                            <option value="all">年代: 指定なし</option>
                            <option value="20s">20代 (F1/M1)</option>
                            <option value="30s">30代 (F2/M2)</option>
                            <option value="40s">40代</option>
                            <option value="senior">50代以上</option>
                        </select>
                    </div>
                    <div style="margin-top:10px;">
                        <select id="swal-time" class="swal2-select" style="width:100%; font-size:14px; margin:0; padding:8px;">
                            <option value="all">🕒 配信時間: 指定なし (終日)</option>
                            <option value="00">00:00 - 01:00</option>
                            <option value="01">01:00 - 02:00</option>
                            <option value="02">02:00 - 03:00</option>
                            <option value="03">03:00 - 04:00</option>
                            <option value="04">04:00 - 05:00</option>
                            <option value="05">05:00 - 06:00</option>
                            <option value="06">06:00 - 07:00</option>
                            <option value="07">07:00 - 08:00</option>
                            <option value="08">08:00 - 09:00</option>
                            <option value="09">09:00 - 10:00</option>
                            <option value="10">10:00 - 11:00</option>
                            <option value="11">11:00 - 12:00</option>
                            <option value="12">12:00 - 13:00</option>
                            <option value="13">13:00 - 14:00</option>
                            <option value="14">14:00 - 15:00</option>
                            <option value="15">15:00 - 16:00</option>
                            <option value="16">16:00 - 17:00</option>
                            <option value="17">17:00 - 18:00</option>
                            <option value="18">18:00 - 19:00</option>
                            <option value="19">19:00 - 20:00</option>
                            <option value="20">20:00 - 21:00</option>
                            <option value="21">21:00 - 22:00</option>
                            <option value="22">22:00 - 23:00</option>
                            <option value="23">23:00 - 24:00</option>
                        </select>
                    </div>
                </div>
            `;

            // New Media & Format Fields
            const mediaFields = `
                <div style="text-align:left; margin-top:15px; border-top:1px dashed #ddd; padding-top:10px;">
                    <label style="font-size:12px; font-weight:bold; color:#555;">📺 フォーマットと長さ (参考価格・1再生1円〜)</label>
                    <select id="swal-format" style="width:100%; padding:8px; border:1px solid #bdc3c7; border-radius:4px;">

                                <option value="standard">標準ビデオ (TV型 横16:9)</option>
                                <option value="short">ショート動画 (スマホ縦 9:16)</option>
                                <option value="image">画像スライド (静止画)</option>
                                <optgroup label="透明LEDフィルム専用 (Yake等)">
                                    <option value="led_fish">鮮魚対面ガラス (1000×300mm / 10:3)</option>
                                    <option value="led_fridge">冷蔵庫ドア (500×1000mm / 1:2)</option>
                                    <option value="led_end">エンド上部 (900×200mm / 9:2)</option>
                                </optgroup>
                            </select>

                    <div style="margin-top:10px;">
                        <label style="font-size:12px; font-weight:bold; color:#555;">🔗 YouTubeリンク (任意)</label>
                        <input id="swal-yt-url" class="swal2-input" placeholder="https://youtu.be/... (ショート動画も可)" style="margin-top:5px; font-size:14px;">
                        <div style="font-size:10px; color:#999;">※ファイルアップロードの代わりに使用</div>
                    </div>
                </div>
            `;

            const { value: formValues } = await Swal.fire({
                title: title,
                width: 600,
                html: `
                    <div style="text-align:left; font-size:12px; color:#666; margin-bottom:5px;">キャンペーン名</div>
                    <input id="swal-name" class="swal2-input" placeholder="例: Summer Sale 2026" style="margin-top:0;">
                    
                    <div style="text-align:left; font-size:12px; color:#666; margin-top:10px; margin-bottom:5px;">予算 (円)</div>
                    <input id="swal-budget" type="number" class="swal2-input" placeholder="例: ${minBudgetNum}" min="${minBudgetNum}" style="margin-top:0;">
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                        <div>
                            <label style="font-size:11px; display:block; text-align:left;">開始日</label>
                            <input id="swal-start" type="date" class="swal2-input" style="font-size:14px; margin:0;">
                        </div>
                        <div>
                            <label style="font-size:11px; display:block; text-align:left;">終了日</label>
                            <input id="swal-end" type="date" class="swal2-input" style="font-size:14px; margin:0;">
                        </div>
                    </div>
                    
                    <div style="margin-top:15px;">${extraFields}</div>
                    ${mediaFields}
                    ${storeSearchFields}
                    ${targetingFields}

                    <div style="margin-top:15px; text-align:left; border-top:1px solid #eee; padding-top:10px;">
                        <label style="font-weight:bold; font-size:12px;">🎥 動画/画像ファイル (※動画は .mp4 / .mov 推奨) <span style="font-size:11px; font-weight:normal; color:#eab308; background:#fefce8; padding:3px 8px; border-radius:12px; margin-left:10px; border:1px solid #fef08a;">💡 推奨: 15秒の動画 (最も離脱率が低く効果的です)</span></label>
                        <div id="swal-dropzone" style="border: 2px dashed #3498db; border-radius: 8px; padding: 20px; text-align: center; margin-top: 10px; cursor: pointer; background: #f8f9fa; transition: 0.3s;">
                            <div style="font-size: 24px; color: #3498db; margin-bottom: 5px;">📥</div>
                            <div style="font-size: 13px; font-weight: bold; color: #2c3e50;" id="swal-filename">クリックまたはドラッグ＆ドロップでアップロード</div>
                            <div style="font-size: 11px; color: #7f8c8d; margin-top: 5px;">※ .mp4 / .mov / 画像ファイル (最大30秒)</div>
                        </div>
                        <input type="file" id="swal-file" accept="video/mp4,video/webm,video/quicktime,image/*" style="display:none;">

                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: '配信登録',
                confirmButtonColor: '#3498db',
                didOpen: () => {
                    window.searchStores = () => {
                        const q = document.getElementById('swal-store-search').value;
                        const resultsDiv = document.getElementById('swal-store-results');
                        if (!q) return;
                        resultsDiv.style.display = 'block';
                        
                        if (q.includes('横浜')) {
                            resultsDiv.innerHTML = `
                                <label style="display:flex; align-items:center; gap:5px; padding:8px; border-bottom:1px solid #ddd; cursor:pointer;">
                                    <input type="checkbox" class="store-checkbox" value="YOKOHAMA_MAIN" checked> 
                                    <span>横浜本店サイネージ (ID: YOKO-001) <span style="color:#2ecc71; font-size:10px;">稼働中: 4台</span></span>
                                </label>
                                <label style="display:flex; align-items:center; gap:5px; padding:8px; cursor:pointer;">
                                    <input type="checkbox" class="store-checkbox" value="YOKOHAMA_WEST" checked> 
                                    <span>横浜西口スーパー (ID: YOKO-002) <span style="color:#2ecc71; font-size:10px;">稼働中: 2台</span></span>
                                </label>
                            `;
                        } else {
                            resultsDiv.innerHTML = '<div style="padding:10px; color:#999; text-align:center;">該当する店舗が見つかりませんでした</div>';
                        }
                    };

                    const dropzone
 = document.getElementById('swal-dropzone');
                    const fileInput = document.getElementById('swal-file');
                    const filenameDisplay = document.getElementById('swal-filename');

                    // Click to open dialog
                    dropzone.addEventListener('click', () => fileInput.click());

                    // Drag over styling
                    dropzone.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        dropzone.style.borderColor = '#2ecc71';
                        dropzone.style.background = '#eafaf1';
                    });
                    dropzone.addEventListener('dragleave', (e) => {
                        e.preventDefault();
                        dropzone.style.borderColor = '#3498db';
                        dropzone.style.background = '#f8f9fa';
                    });

                    // Handle drop
                    dropzone.addEventListener('drop', (e) => {
                        e.preventDefault();
                        dropzone.style.borderColor = '#3498db';
                        dropzone.style.background = '#f8f9fa';

                        if (e.dataTransfer.files.length > 0) {
                            fileInput.files = e.dataTransfer.files; // Assign to hidden input
                            filenameDisplay.innerHTML = `<span style="color:#2ecc71;">✅ ${e.dataTransfer.files[0].name}</span>`;
                        }
                    });

                    // Handle classic selection
                    fileInput.addEventListener('change', () => {
                        if (fileInput.files.length > 0) {
                            filenameDisplay.innerHTML = `<span style="color:#2ecc71;">✅ ${fileInput.files[0].name}</span>`;
                        }
                    });
                },
                preConfirm: async () => {
                    const name = document.getElementById('swal-name').value;
                    const budget = document.getElementById('swal-budget').value;
                    const fileInput = document.getElementById('swal-file');
                    const format = document.getElementById('swal-format').value;

                    if (!name || budget === '' || parseInt(budget) < minBudgetNum) {
                        Swal.showValidationMessage(`名前と予算(最低${minBudgetNum}円)は必須です`);
                        return false;
                    }

                    // Validate Video Duration / Image Type
                    if (fileInput.files.length > 0) {
                        const file = fileInput.files[0];

                        if (format === 'image') {
                            if (!file.type.startsWith('image/')) {
                                Swal.showValidationMessage('画像スライドプランには画像ファイルをアップロードしてください');
                                return false;
                            }
                        } else if (file.type.startsWith('video/')) {
                            try {
                                const duration = await getVideoDuration(file);
                                let isValid = true;
                                let expected = "";

                                if (format === 'standard' && (duration < 14 || duration > 46)) {
                                    isValid = false; expected = "最大45秒";
                                } else if (format === 'short' && (duration < 4 || duration > 10)) { // 5-8s but slightly lenient
                                    isValid = false; expected = "5~8秒";
                                }

                                if (!isValid) {
                                    Swal.showValidationMessage(`動画の長さが一致しません。\n現在: ${duration.toFixed(1)}秒 / プラン規定: ${expected}`);
                                    return false;
                                }
                            } catch (e) {
                                Swal.showValidationMessage('動画ファイルの検証に失敗しました');
                                return false;
                            }
                        }
                    }

                    // Convert to Base64 if file is present
                    let fileUrl = null;
                    if (fileInput.files.length > 0) {
                        try {
                            fileUrl = await fileToBase64(fileInput.files[0]);
                        } catch (e) {
                            console.error("File Read Error:", e);
                            Swal.showValidationMessage('ファイルの読み込みに失敗しました');
                            return false;
                        }
                    }

                    const checkboxes = document.querySelectorAll('.store-checkbox:checked');
                    const targetStores = Array.from(checkboxes).map(c => c.value);

                    return {
                        name: name,
                        budget: budget,
                        start: document.getElementById('swal-start').value,
                        end: document.getElementById('swal-end').value,
                        trigger: document.getElementById('swal-trigger')?.value,
                        target: document.getElementById('swal-target')?.value,
                        gender: document.getElementById('swal-gender').value,
                        age: document.getElementById('swal-age').value,
                        time: document.getElementById('swal-time').value,
                        format: format,
                        ytUrl: document.getElementById('swal-yt-url').value,
                        fileUrl: fileUrl, // Send Base64
                        fileName: fileInput.files.length > 0 ? fileInput.files[0].name : null, // Send Filename
                        targetStores: targetStores.length > 0 ? targetStores : ['all'] // New attribute
                    }
                }
            });

            if (formValues) {
                // Call API with shared logic
                try {
                    // Try to get logged in user's email
                    let adEmail = "client@example.com"; 
                    try {
                        const meRes = await fetch(`${API_URL}/api/user/me`);
                        const meData = await meRes.json();
                        if (meData && meData.user && meData.user.email) {
                            adEmail = meData.user.email;
                        }
                    } catch(e) {}

                    const res = await fetch(`${API_URL}/api/campaigns`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: formValues.name,
                            budget: formValues.budget,
                            start: formValues.start,
                            end: formValues.end,
                            plan: plan,
                            trigger: (plan === 'moment') ? { weather: formValues.trigger } : null,
                            target_imp: (plan === 'impression') ? parseInt(formValues.target) : null,
                            targeting: {
                                gender: formValues.gender,
                                age: formValues.age,
                                time: formValues.time
                            },
                            youtube_url: formValues.ytUrl,
                            url: formValues.fileUrl, // Pass Base64 as main URL
                            filename: formValues.fileName, // Store original filename
                            format: formValues.format,
                            ad_email: adEmail
                        })
                    });

                    if (res.ok) {
                        let targetInfo = "";
                        if (formValues.gender !== 'all' || formValues.age !== 'all' || formValues.time !== 'all' || (formValues.targetStores && formValues.targetStores[0] !== 'all')) {
                            const genderMap = { 'female': '女性', 'male': '男性', 'all': '指定なし' };
                            const ageMap = { '20s': '20代', '30s': '30代', '40s': '40代', 'senior': '50代+', 'all': '指定なし' };
                            const timeMap = { 'morning': '朝', 'lunch': '昼', 'evening': '夕方', 'night': '夜', 'all': '終日' };
                            
                            let storesText = "指定なし (全国)";
                            if (formValues.targetStores && formValues.targetStores[0] !== 'all') {
                                storesText = formValues.targetStores.join(', ');
                            }

                            targetInfo = `<br><div style="margin-top:10px; padding:10px; background:#f0f8ff; border-radius:4px; text-align:left; font-size:12px;">
                                <b>🎯 ターゲティング設定:</b><br>
                                ・店舗/エリア: ${storesText}<br>
                                ・性別: ${genderMap[formValues.gender] || formValues.gender}<br>

                                ・年代: ${ageMap[formValues.age] || formValues.age}<br>
                                ・時間: ${timeMap[formValues.time] || formValues.time}
                            </div>`;
                        }

                        Swal.fire({
                            title: '配信設定完了！',
                            html: `キャンペーン「${formValues.name}」を作成しました。${targetInfo}<br>
                                   <div style="margin-top:10px; font-size:14px; color:#555;">
                                   データは分析ダッシュボード(Advertiser Dashboard)に連携されます。
                                   <br><b>※費用はアカウント残高（Budget）から消費されます</b>
                                   </div>`,
                            icon: 'success',
                            showCancelButton: true,
                            confirmButtonText: '分析ダッシュボードへ移動',
                            cancelButtonText: '閉じる'
                        }).then(async (result) => {
                            if (result.isConfirmed) {
                                window.location.href = '/advertiser/analytics';
                            } else {
                                if (typeof loadData === 'function') loadData();
                            }
                        });
                    } else {
                        throw new Error('API Error');
                    }
                } catch (e) {
                    console.error("Campaign Creation Failed:", e);
                    Swal.fire({
                        icon: 'error',
                        title: '配信エラー (詳細)',
                        html: `
                             <div style="text-align:left; font-size:12px;">
                                 <b>エラー内容:</b> ${e.message}<br>
                                 <details style="margin-top:5px; color:#555;">
                                     <summary>技術詳細 (Stack Trace)</summary>
                                     <pre style="background:#eee; padding:5px; overflow:auto; max-height:100px;">${e.stack || 'No stack trace'}</pre>
                                 </details>
                                 <br>
                                 ※ サーバー(http://localhost:3000)が起動しているか確認してください。<br>
                                 ※ ファイルサイズが大きすぎる可能性があります(Max 50MB)。
                             </div>
                         `,
                        confirmButtonText: '閉じる'
                    });
                }
            }
        }


        // --- NEW FEATURES ---
        window.currentUser = null;

        document.addEventListener('DOMContentLoaded', async () => {
            function updateDashboardDate() {
                const dateSpan = document.getElementById('current-date-text');
                if (dateSpan) {
                    const now = new Date();
                    const days = ['日', '月', '火', '水', '木', '金', '土'];
                    const year = now.getFullYear();
                    const month = now.getMonth() + 1;
                    const d = now.getDate();
                    const dayStr = days[now.getDay()];
                    dateSpan.innerText = `📅 今日: ${year}/${month.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')} (${dayStr})`;
                }
            }
            updateDashboardDate();

            // Check past midnight crossing every hour
            setInterval(updateDashboardDate, 3600000);

            try {
                // Fetch User Info
                const res = await fetch(`${API_URL}/api/user/me`);
                const data = await res.json();
                if (data.success && data.user) {
                    window.currentUser = data.user;

                    // Update Sidebar Email
                    const emailEl = document.getElementById('user-email');
                    if (emailEl) emailEl.innerText = data.user.email;
                }
            } catch (e) {
                console.error("Failed to fetch user info", e);
            }

            // Ensure loadData is called if not already triggered by other means
            if (typeof loadData === 'function') setTimeout(loadData, 500);
        });

        async function registerCreditCard() {
            const { value: amount } = await Swal.fire({
                title: '予算チャージ (Square決済)',
                preConfirm: (value) => { const v = parseInt(value); if(isNaN(v) || v < minBudgetNum) { Swal.showValidationMessage(`最低課金金額は${minBudgetNum}円です`); return false; } return v; },
                html: 'チャージする金額（円）を入力してください。<br><span style="font-size: 13px; color: #dc2626; display: block; margin-top: 10px;">デモアカウントでもチャージ出来るので、クレジット決済する場合は、本番環境で課金をしてください。</span>',
                input: 'number',
                inputAttributes: { min: minBudgetNum, step: 1000 },
                inputValue: 100000,
                showCancelButton: true,
                confirmButtonText: '決済ページへ進む'
            });

            if (amount) {
                Swal.fire({
                    title: '決済情報の入力',
                    html: `
                        <div id="sq-payment-form" style="display:flex; flex-direction:column; gap:10px;">
                            <div id="apple-pay-button" style="margin-bottom:10px;"></div>
                            <div id="google-pay-button"></div>
                            <div id="sq-card-container"></div>
                            <button id="sq-creditcard" style="padding:10px; background:#0f172a; color:white; border-radius:5px; border:none; cursor:pointer;">クレジットカードで決済</button>
                            <div id="sq-status" style="color:#ef4444; font-weight:bold; font-size:12px; margin-top:5px;"></div>
                        </div>
                    `,
                    showConfirmButton: false,
                    showCancelButton: true,
                    didOpen: () => {
                        initializeSquarePayment(amount, 'sq-card-container', () => {
                            const b = parseInt(localStorage.getItem('accountBudget') || "0");
                            localStorage.setItem('accountBudget', b + parseInt(amount));
                            updateBudgetDisplays();
                            Swal.fire('成功', '決済が完了し、アカウントの予算が追加されました', 'success');
                        });
                    }
                });
            }
        }

        async function updateBudgetDisplays() {
            try {
                const res = await fetch(`${API_URL}/api/campaigns`);
                if(res.ok) {
                    const camps = await res.json();
                    let totalSpend = 0;
                    camps.forEach(c => totalSpend += Number(c.spend || 0));
                    const spendEl = document.getElementById('account-spend-display');
                    if(spendEl) spendEl.innerText = totalSpend.toLocaleString();
                }
                const b = parseInt(localStorage.getItem('accountBudget') || "0");
                const budgetEl = document.getElementById('account-budget-display');
                if(budgetEl) budgetEl.innerText = b.toLocaleString();
            } catch(e) { console.error(e) }
        }

        // Call update on load
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(updateBudgetDisplays, 1000);
        });

        function handleSupport() {
            const email = window.currentUser ? window.currentUser.email : 'Guest';
            Swal.fire({
                title: 'お問い合わせ',
                html: `
                    <p style="font-size:14px; color:#555; margin-bottom:15px; text-align:left;">
                        サポート等のご連絡はこちらから送信してください。<br>
                        <span style="color:#7f8c8d; font-size:12px;">From: <b>${email}</b></span><br>
                        <span style="color:#7f8c8d; font-size:12px;">To: <b>info@retail-ad.awsapps.com</b></span>
                    </p>
                    <textarea id="support-msg" class="swal2-textarea" placeholder="お問い合わせ内容を入力してください..." style="margin-top:5px;"></textarea>
                `,
                confirmButtonText: '送信 (Send)',
                showCancelButton: true,
                preConfirm: () => {
                    const msg = document.getElementById('support-msg').value;
                    if (!msg) Swal.showValidationMessage('メッセージを入力してください');
                    return msg;
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    // Simulation
                    Swal.fire({
                        icon: 'success',
                        title: '送信完了',
                        html: `お問い合わせを受け付けました。<br>担当者より <b>${email}</b> 宛にご連絡いたします。`
                    });
                }
            });
        }

        // Override editProfile to show email
        const originalEditProfile = window.editProfile;
        window.editProfile = function () {
            const email = window.currentUser ? window.currentUser.email : 'Unknown';
            const currentBrand = document.getElementById('brand-name').innerText;

            Swal.fire({
                title: 'プロフィール編集',
                html: `
                    <label style="display:block; text-align:left; font-size:12px; color:#7f8c8d;">Login Email (Read-only)</label>
                    <input class="swal2-input" value="${email}" disabled style="background:#f1f1f1; color:#7f8c8d;">
                    <label style="display:block; text-align:left; font-size:12px; margin-top:10px;">Brand Name</label>
                    <input id="edit-brand" class="swal2-input" value="${currentBrand === 'My Brand' ? '' : currentBrand}" placeholder="Enter Brand Name">
                `,
                confirmButtonText: '保存 (Save)',
                showCancelButton: true,
                preConfirm: () => {
                    return document.getElementById('edit-brand').value;
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    document.getElementById('brand-name').innerText = result.value;
                    Swal.fire('Saved', 'Brand name updated!', 'success');
                }
            });
        }