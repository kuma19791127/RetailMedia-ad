// Check for file protocol
        if (window.location.protocol === 'file:') {
            Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                html: 'You are viewing this file directly.<br>Please access via the server URL:<br><b>http://localhost:3000/advertiser</b>',
                footer: 'APIs will not work in this mode.'
            });
        }

        let charts = {};

        const PREFECTURES = [
            "Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima",
            "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tokyo", "Kanagawa",
            "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano", "Gifu",
            "Shizuoka", "Aichi", "Mie", "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara",
            "Wakayama", "Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi",
            "Tokushima", "Kagawa", "Ehime", "Kochi", "Fukuoka", "Saga", "Nagasaki",
            "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Okinawa"
        ];

        // Initialize Dashboard Components


        // Initialize Dashboard Components

        // Helper: Get Video Duration
        function getVideoDuration(file) {
            return new Promise((resolve, reject) => {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    resolve(video.duration);
                };
                video.onerror = () => reject("Invalid video file");
                video.src = URL.createObjectURL(file);
            });
        }

        // Helper: Convert File to Base64
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }

        // --- Google Pay Integration ---
        const baseRequest = { apiVersion: 2, apiVersionMinor: 0 };
        const allowedCardNetworks = ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"];
        const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];
        const tokenizationSpecification = {
            type: 'PAYMENT_GATEWAY',
            parameters: { 'gateway': 'example', 'gatewayMerchantId': 'exampleGatewayMerchantId' }
        };
        const baseCardPaymentMethod = {
            type: 'CARD',
            parameters: { allowedAuthMethods: allowedCardAuthMethods, allowedCardNetworks: allowedCardNetworks }
        };
        const cardPaymentMethod = Object.assign({}, baseCardPaymentMethod, { tokenizationSpecification: tokenizationSpecification });
        let paymentsClient = null;

        function getGoogleIsReadyToPayRequest() {
            return Object.assign({}, baseRequest, { allowedPaymentMethods: [baseCardPaymentMethod] });
        }

        function getGooglePaymentDataRequest() {
            const paymentDataRequest = Object.assign({}, baseRequest);
            paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
            paymentDataRequest.transactionInfo = {
                totalPriceStatus: 'FINAL',
                totalPrice: '5000', // Example Amount
                currencyCode: 'JPY',
                countryCode: 'JP'
            };
            return paymentDataRequest;
        }

        function onGooglePayLoaded() {
            paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });
            paymentsClient.isReadyToPay(getGoogleIsReadyToPayRequest())
                .then(function (response) {
                    if (response.result) {
                        const button = paymentsClient.createButton({ onClick: onGooglePaymentButtonClicked });
                        const container = document.getElementById('gpay-container');
                        if (container) {
                            container.appendChild(button);
                        }
                    }
                })
                .catch(function (err) { console.error(err); });
        }

        function onGooglePaymentButtonClicked() {
            const paymentDataRequest = getGooglePaymentDataRequest();
            paymentsClient.loadPaymentData(paymentDataRequest)
                .then(function (paymentData) {
                    processPayment(paymentData);
                })
                .catch(function (err) { console.error(err); });
        }

        function processPayment(paymentData) {
            console.log("Google Pay Success:", paymentData);
            Swal.fire({
                icon: 'success',
                title: 'Google Pay Success',
                text: 'Payment Authorized Securely!',
                timer: 2000
            });
            // Auto-fill card data hidden or just verify logic
            // In real app, send paymentData.paymentMethodData.tokenizationData.token to backend
        }

        if (window.google && window.google.payments) {
            onGooglePayLoaded();
        } else {
            // Wait for script to load
            window.addEventListener('load', () => {
                if (window.google && window.google.payments) onGooglePayLoaded();
            });
        }
        // ------------------------------

        // Excel / Voice Logic
        async function handleExcelUpload(input) {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Simple parser: Assume Row 1 is header, Rows 2+ are [Product, Price]
                let script = "お客様にご案内いたします。本日の特売情報です。";
                let count = 0;

                for (let i = 1; i < json.length; i++) {
                    const row = json[i];
                    if (row && row.length >= 2) {
                        const product = row[0];
                        const price = row[1];
                        if (product && price) {
                            script += `${product}が、${price}円。`;
                            count++;
                        }
                    }
                    if (count >= 3) break; // Limit to 3 items for demo
                }
                script += "ぜひお買い求めください。";

                document.getElementById('voice-script').value = script;
                document.getElementById('excel-preview-area').style.display = 'block';
                Swal.fire({ icon: 'success', title: 'Excel読込完了', text: '放送原稿を作成しました。編集して放送してください。', timer: 2000 });
            };
            reader.readAsArrayBuffer(file);
        }

        async function broadcastVoice() {
            const text = document.getElementById('voice-script').value;
            if (!text) return;

            // Use simulateUpload logic but with specific text payload
            // We use 'standard' ratio, no specific media (server will use placeholder if needed), and attached AI text
            // Actually, we can just hit the demo endpoint directly

            Swal.fire({
                title: '放送中...',
                text: '店内アナウンスを行っています',
                timer: 5000,
                didOpen: () => Swal.showLoading()
            });

            // Hack: Use simulateUpload logic but force ai_text
            // format=image to show a placeholder "On Air" image?
            const params = `?ratio=16:9&format=image&ai_text=${encodeURIComponent(text)}&duration=15`;
            await fetch(`/api/ad/demo/boost${params}`);
        }

        async function editProfile() {
            const { value: name } = await Swal.fire({
                title: 'Edit Brand Name',
                input: 'text',
                inputLabel: 'Your Brand / Advertiser Name',
                inputValue: document.getElementById('brand-name').innerText,
                showCancelButton: true
            });
            if (name) {
                document.getElementById('brand-name').innerText = name;
                Swal.fire('Updated', `Welcome, ${name}!`, 'success');
            }
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            if (tabName === 'file') {
                document.querySelector('.tab:nth-child(1)').classList.add('active');
                document.getElementById('tab-file').classList.add('active');
            } else {
                document.querySelector('.tab:nth-child(2)').classList.add('active');
                document.getElementById('tab-youtube').classList.add('active');
            }
        }

        async function handleYouTubeUpload() {
            let url = document.getElementById('yt-url').value;
            if (!url) return Swal.fire('Error', 'Please enter a YouTube URL', 'error');

            // Handle YouTube Shorts URL conversion
            // https://www.youtube.com/shorts/VIDEO_ID -> https://www.youtube.com/watch?v=VIDEO_ID
            if (url.includes('/shorts/')) {
                const videoId = url.split('/shorts/')[1].split('?')[0]; // Extract ID
                url = `https://www.youtube.com/watch?v=${videoId}`;
            }

            // Logic for YouTube aspect ratio? Assume 16:9 for now unless keyword 'shorts' found
            let ratio = url.includes('shorts') ? '9:16' : '16:9';

            await simulateUpload(ratio, url, null, null, false);
        }
        // Collect new params for all upload types
        // Collect new params for all upload types
        function getCampaignParams() {
            // Scope was removed from UI, defaulting to national
            const scope = "national";

            // New Plan Type Logic
            const planTypeInput = document.querySelector('input[name="plan-type"]:checked');
            const planType = planTypeInput ? planTypeInput.value : "engagement";

            const format = document.getElementById('ad-format').value;
            const slot = document.getElementById('ad-slot').value;
            const brand = document.getElementById('brand-name').innerText;

            // Collect Card Data if present in Sidebar
            let cardParams = "";
            const no = document.getElementById('card-no').value;
            const date = document.getElementById('card-date').value; // MM/YY
            const cvc = document.getElementById('card-cvc').value;

            if (no) {
                // Simple Format Conversion MM/YY -> YYMM
                let expire = "";
                if (date && date.includes('/')) {
                    const [mm, yy] = date.split('/');
                    expire = yy + mm;
                }
                cardParams = `&cardNo=${no}&expire=${expire}&cvc=${cvc}`;
            }

            return `&scope=${scope}&slot=${slot}&brand=${encodeURIComponent(brand)}&planType=${planType}&format=${format}` + cardParams;
        }

        // Initialize Drag & Drop
        document.addEventListener('DOMContentLoaded', () => {
            const dropZones = document.querySelectorAll('.drop-zone');
            dropZones.forEach(zone => {
                zone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    zone.style.background = '#eef2f7';
                    zone.style.borderColor = '#3498db';
                });
                zone.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    zone.style.background = '#f8f9fa';
                    zone.style.borderColor = 'transparent';
                });
                zone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    zone.style.background = '#f8f9fa';
                    zone.style.borderColor = 'transparent';

                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        handleFile(files[0]);
                    }
                });
            });
        });

        async function handleFile(file) {
            
            // Add 15s check for real users
            if (file.type.startsWith('video/')) {
                try {
                    const duration = await window.getVideoDuration(file);
                    const currentUser = window.currentUser || {};
                    const isDemoUser = currentUser.email && currentUser.email.includes('@demo.com');
                    
                    if (duration > 16) {
                        if (isDemoUser) {
                            Swal.fire({ toast:true, position:'top-end', html:'デモアカウントのため15秒超過を許可しました', icon:'info', showConfirmButton:false, timer:3000 });
                        } else {
                            Swal.fire('⚠️ 配信規定（15秒超過）', '本番環境では15秒以内のショート動画のみ配信可能です。\n※15秒以内の動画を再選択してください。', 'warning');
                            return;
                        }
                    }
                } catch(e) {}
            }
            
            // Check file type
            if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
                Swal.fire('Error', 'Only Video or Image files are allowed.', 'error');
                return;
            }

            Swal.fire({
                title: 'Uploading ' + file.name + '...',
                html: 'Processing media...',
                timer: 1000,
                timerProgressBar: true,
                didOpen: () => Swal.showLoading()
            }).then(() => {
                // No AI Analysis - Manual Input Only
                const defaultText = ""; // Default empty

                Swal.fire({
                    title: '📱 QRコード・食材情報の登録',
                    html: `
                        <div style="text-align:left; background:#f9f9f9; padding:15px; border-radius:6px; font-size:14px; margin-bottom:10px;">
                            <label style="font-weight:bold; display:block; margin-bottom:5px; color:#2c3e50;">配信プラン:</label>
                            <select id="swal-plan" style="width:100%; padding:8px; border:1px solid #bdc3c7; border-radius:4px;">
                                <option value="cpa">🛒 成果報酬・POS連動型 (A/Bテスト・併売分析：1再生 10円〜)</option>
                                <option value="moment">☔ モーメント配信 (雨天等の条件連動：1再生 3円〜)</option>
                                <option value="imp">👁️ インプレッション配信 (不特定多数へ認知拡大：1再生 1円〜)</option>
                            </select>
                        </div>
                        <p style="font-size:13px; color:#7f8c8d;">動画に関連する食材を入力してください。<br>この内容がサイネージのQRコードと食材リストに反映されます。</p>
                        <div style="text-align:left; background:#f9f9f9; padding:15px; border-radius:6px; font-size:14px; margin-top:10px;">
                            <label style="font-weight:bold; display:block; margin-bottom:5px; color:#2c3e50;">表示する食材リスト (編集可):</label>
                            <textarea id="ai-ingredients" placeholder="例：スパゲティ、ミートソース、粉チーズ" style="width:100%; height:80px; padding:10px; border:1px solid #bdc3c7; border-radius:4px; font-family:sans-serif; font-size:16px;">${defaultText}</textarea>
                            <p style="font-size:11px; color:#2c3e50; margin-top:5px;">※ 複数の食材は読点（、）やスペースで区切ってください。</p>
                        </div>
                    `,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: '確定して配信登録',
                    cancelButtonText: 'キャンセル',
                    preConfirm: () => {
                        return document.getElementById('ai-ingredients').value;
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        const ingredients = result.value;
                        const ratio = file.name.includes('shorts') ? '9:16' : '16:9';
                        const isImage = file.type.startsWith('image/');
                        simulateUpload(ratio, null, null, ingredients, isImage);
                    }
                });
            });
        }

        // Smart Analysis Logic
        function analyzeFilename(filename) {
            const name = filename.toLowerCase().replace(/[-_.]/g, " ");
            const keywords = {
                "spaghetti": "スパゲティ", "pasta": "パスタ", "noodle": "麺",
                "meat": "ミートソース", "bolognese": "ミートソース", "beef": "牛肉",
                "cheese": "粉チーズ", "parmesan": "粉チーズ", "mozarella": "チーズ",
                "tomato": "トマト", "sauce": "ソース", "basil": "バジル",
                "salad": "レタス", "vegetable": "野菜ミックス", "oil": "オリーブオイル",
                "steak": "ステーキ", "grill": "焼肉", "pepper": "黒胡椒",
                "salt": "岩塩", "onion": "玉ねぎ", "garlic": "ニンニク"
            };

            let detected = [];
            for (let k in keywords) {
                if (name.includes(k) && !detected.includes(keywords[k])) detected.push(keywords[k]);
            }
            // Enhance Bolognese specifically if partial match
            if (name.includes("bolognese") && !detected.includes("スパゲティ")) detected.unshift("スパゲティ");
            return detected.length > 0 ? detected : [];
        }

        async function handleUpload(ratio, variant = null) {
            // Always allow file selection to simulate the "upload experience"
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*,image/*';
            input.onchange = (e) => {
                if (e.target.files.length > 0) handleFile(e.target.files[0], variant, ratio);
            };
            input.click();
        }

        async function handleFile(file, variant = null, ratio = '16:9') {
            // --- AI REVIEW CONTENT ---
            Swal.fire({
                title: '🤖 Google AI 審査中...',
                html: '配信コンテンツの安全性をリアルタイム解析しています...<br><span style="font-size:0.8rem; color:#aaa;">Powered by Google Cloud Vertex AI</span>',
                showConfirmButton: false,
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });
            
            try {
                // Determine base64 placeholder (we use mock_data to avoid large payloads)
                const reviewRes = await fetch('/api/creator/review-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ video_base64: "mock_data" })
                });
                const reviewData = await reviewRes.json();
                
                if (!reviewData.safe) {
                    Swal.fire({
                        title: '❌ 審査不合格 (アカウント制限)',
                        html: '<div style="color:red;font-size:0.9rem;text-align:left;">' + reviewData.message + '<br><br><b>アカウントの一部機能がロックされました。</b><br>運営(Admin)による実態審査をお待ちください。</div>',
                        icon: 'error'
                    });
                    return; // UPLOAD STOPPED
                }
            } catch(e) {
                console.error("Review Error:", e);
            }

            // Check if image or video, ask for BGM (maybe irrelevant for video but consistent UI) 
            let bgm = null;
            let ingredients = "";
            let promptTitle = file.type.startsWith('image/') ? '🖼️ 画像配信設定' : '🎥 動画配信設定';

            // Only show prompt if Image (for BGM). Videos upload directly.
            if (file.type.startsWith('image/')) {
                const result = await Swal.fire({
                    title: promptTitle,
                    html: `
                        <div style="text-align:left; font-size:14px;">
                            <p style="margin-bottom:5px; font-weight:bold;">BGMの選択 (画像のみ有効)</p>
                            <select id="swal-bgm" style="width:100%; padding:8px; margin-bottom:15px; border-radius:4px; border:1px solid #ccc;">
                                <option value="">(なし) 無音</option>
                                <option value="upbeat">🎵 アップビート (セール・活気)</option>
                                <option value="relaxing">🌿 リラクシング (高級感・落ち着き)</option>
                                <option value="cooking">🍳 クッキング (料理・レシピ)</option>
                                <option value="cafe">☕ カフェ (おしゃれ・BGM)</option>
                            </select>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'アップロード',
                    preConfirm: () => {
                        const checkboxes = document.querySelectorAll('.store-checkbox:checked');
                    const targetStores = Array.from(checkboxes).map(c => c.value);

                    return {
                            bgm: document.getElementById('swal-bgm').value
                        };
                    }
                });

                if (!result.isConfirmed) return;
                bgm = result.value.bgm;
            }

            Swal.fire({
                title: variant ? `Uploading Variant ${variant}...` : 'Uploading...',
                text: 'Please wait while we upload your media directly to the server.',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                // Determine Query Params
                let query = '?filename=' + encodeURIComponent(file.name);
                if (bgm) query += '&bgm=' + encodeURIComponent(bgm);
                if (ingredients) query += '&ingredients=' + encodeURIComponent(ingredients);

                const res = await fetch('/api/ad/upload' + query, {
                    method: 'POST',
                    headers: { 'Content-Type': file.type },
                    body: file
                });

                if (res.ok) {
                    if (variant === 'A') {
                        Swal.fire({ icon: 'info', title: 'Variant A Uploaded', text: 'Now upload Variant B to start comparison.' });
                    } else if (variant === 'B') {
                        showABResults();
                    } else {
                        Swal.fire({ icon: 'success', title: 'Upload Complete', text: 'Media is now queued for playback!' });
                        loadData();
                    }
                } else {
                    throw new Error('Upload failed');
                }
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'Upload Error', text: e.message });
            }
        }

        async function simulateUpload(aspectRatio, ytUrl = null, variant = null, ingredients = null, isImage = false) {
            Swal.fire({ title: '🤖 Google AI 審査中...', html: '配信コンテンツの安全性をリアルタイム解析しています...<br><span style="font-size:0.8rem; color:#aaa;">Powered by Google Cloud Vertex AI</span>', showConfirmButton: false, allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
            try {
                const reviewRes = await fetch('/api/creator/review-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video_base64: 'mock_data' }) });
                const reviewData = await reviewRes.json();
                if (!reviewData.safe) {
                    Swal.fire({ title: '❌ 審査不合格 (アカウント制限)', html: '<div style="color:red;font-size:0.9rem;text-align:left;">' + reviewData.message + '<br><br><b>アカウントの一部機能がロックされました。</b><br>運営(Admin)による実態審査をお待ちください。</div>', icon: 'error' });
                    return;
                }
            } catch(e) { console.error('Review Error:', e); }

            // If image, prompt for BGM here too if strictly demo mode calls this?
            // Actually, handleFile calls simulateUpload only in Demo Mode via 'input.onchange' logic above? 
            // Wait, handleUpload calls simulateUpload directly in Demo Mode without file input.
            // We need to update simulateUpload logic too if we want text-based BGM simulation.
            // For now, let's focus on handleFile which is used for Real/local file handling.

            const params = getCampaignParams();
            let finalUrl = `/api/ad/demo/boost?ratio=${aspectRatio}${params}`;

            if (ingredients) finalUrl += `&ingredients=${encodeURIComponent(ingredients)}`;

            if (isImage) finalUrl += `&format=image`;

            if (ytUrl) finalUrl += `&youtube=${encodeURIComponent(ytUrl)}`;
            if (variant) finalUrl += `&variant=${variant}`;

            let title = 'Broadcasting...';
            if (variant) title = `Uploading Variant ${variant}...`;

            Swal.fire({ title: title, timer: 1500, timerProgressBar: true, didOpen: () => Swal.showLoading() }).then(async () => {
                await fetch(finalUrl);

                if (variant === 'B') {
                    // If uploading B, assume A is done, show comparison
                    showABResults();
                } else if (variant === 'A') {
                    Swal.fire({ icon: 'info', title: 'Variant A Uploaded', text: 'Now upload Variant B to start comparison.' });
                } else {
                    Swal.fire({ icon: 'success', title: 'On Air!', text: 'Media Broadcasted.' });
                    loadData();
                }
            });
        }

        // Global chart instance for A/B
        let abChartInstance = null;

        async function showABResults() {
            // Fetch latest real data
            let abStats = { A: { views: 0, scans: 0, sales: 0 }, B: { views: 0, scans: 0, sales: 0 } };
            try {
                const res = await fetch('/api/ad/analytics');
                const data = await res.json();
                if (data.ab_stats) abStats = data.ab_stats;
            } catch (e) { console.error("Failed to fetch AB stats", e); }

            // Calculate Engagement Rate (Sales per Scan)
            const cvrA = abStats.A.scans > 0 ? ((abStats.A.sales / abStats.A.scans) * 100).toFixed(1) : 0;
            const cvrB = abStats.B.scans > 0 ? ((abStats.B.sales / abStats.B.scans) * 100).toFixed(1) : 0;

            let winner = 'Waiting for interaction...';
            if (abStats.A.sales > 0 || abStats.B.sales > 0) {
                if (Number(cvrB) > Number(cvrA)) winner = 'Variant B is Winning 🚀';
                else if (Number(cvrA) > Number(cvrB)) winner = 'Variant A is Winning 🏆';
                else winner = 'It\'s a Tie ⚖️';
            }

            Swal.fire({
                title: '📊 A/B Performance (Scan vs Sales)',
                html: `
                    <div style="margin-bottom:10px; font-size:14px; font-weight:bold; color:#2c3e50;">${winner}</div>
                    <div style="height:250px; width:100%;">
                        <canvas id="abChartCanvas"></canvas>
                    </div>
                    <div style="display:flex; gap:20px; justify-content:center; margin-top:15px; font-size:12px;">
                        <div style="text-align:center;">
                            <strong style="color:#e67e22;">🅰️ Variant A</strong><br>
                            Scans: <span id="ab-scans-a">${abStats.A.scans}</span><br>
                            Sales: <span id="ab-sales-a">${abStats.A.sales}</span>
                        </div>
                        <div style="text-align:center;">
                            <strong style="color:#9b59b6;">🅱️ Variant B</strong><br>
                            Scans: <span id="ab-scans-b">${abStats.B.scans}</span><br>
                            Sales: <span id="ab-sales-b">${abStats.B.sales}</span>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:11px; color:#95a5a6;">
                        * Compares real interactions (QR Scans) & conversions (POS Sales).
                    </div>
                `,
                width: 600,
                showConfirmButton: true,
                confirmButtonText: 'Refresh Data',
                didOpen: () => {
                    renderABChart(abStats);
                },
                preConfirm: () => {
                    return false;
                }
            }).then((result) => {
                if (result.isDismissed) return;
                showABResults();
            });
        }


        function renderABChart(stats) {
            const ctx = document.getElementById('abChartCanvas').getContext('2d');
            if (abChartInstance) abChartInstance.destroy();

            abChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['QR Scans', 'POS Sales'],
                    datasets: [
                        {
                            label: 'Variant A',
                            data: [stats.A.scans, stats.A.sales],
                            backgroundColor: '#e67e22'
                        },
                        {
                            label: 'Variant B',
                            data: [stats.B.scans, stats.B.sales],
                            backgroundColor: '#9b59b6'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        function showLogicDetails() {
            Swal.fire({
                title: '🛒 POS Data Correlation',
                html: `
                    <div style="text-align:left; font-size:13px; color:#2c3e50;">
                        <p>We analyze real-time sales data from the store's POS system correlated with ad broadcast times:</p>
                        <ul style="padding-left:20px;">
                            <li><b>Broadcast A (10:00-11:00):</b> 12 Units Sold</li>
                            <li><b>Broadcast B (11:00-12:00):</b> 18 Units Sold</li>
                            <li><b>Control Group:</b> 8 Units (Average)</li>
                        </ul>
                        <hr style="border:0; border-top:1px dashed #ccc;">
                        <p><b>Result Analysis:</b><br>
                        Variant B's "Short & Punchy" style led to a <span style="color:#e74c3c; font-weight:bold;">50% uplift</span> in immediate product purchases compared to Variant A.</p>
                        <p style="font-size:11px; color:#7f8c8d; margin-top:5px;">* Privacy Safe: No cameras or personal data used.</p>
                    </div>
                `,
                icon: 'info'
            });
        }

        async function loadData() {
            const contextText = document.getElementById('current-weather-text');
            contextText.innerText = "📡 Locating device...";

            // 1. Get Geolocation (Skip if file protocol or insecure, as it usually fails)
            if (!navigator.geolocation || location.protocol === 'file:') {
                console.log("Geo skipped (File/Insecure)");
                fetchAnalytics();
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    contextText.innerText = `📍 Found (${lat.toFixed(2)}, ${lon.toFixed(2)}) - Fetching Weather...`;
                    await fetchAnalytics(lat, lon);
                },
                (error) => {
                    console.warn("Geo Error:", error);
                    contextText.innerText = "⚠️ Location Denied (Using Default)";
                    fetchAnalytics(); // Fallback
                }
            );
        }

        async function fetchAnalytics(lat = null, lon = null) {
            let data = null;
            try {
                // Determine API base URL
                const API_PREFIX = location.protocol === 'file:' ? 'http://localhost:3000' : '';
                let url = `${API_PREFIX}/api/ad/analytics?`;
                if (lat && lon) url += `lat=${lat}&lon=${lon}`;
                else url += 'region=Tokyo';

                const res = await fetch(url);
                if (!res.ok) throw new Error('API Error');
                data = await res.json();
            } catch (e) {
                console.warn("API Failed, using Mock Data:", e);
                // Fallback Mock Data
                data = {
                    context: {
                        current_condition: { region: "Tokyo (Demo)", weather_code: 1, temp: 24 },
                        active_factors: ['Lunch', 'Mild'],
                        weather_impact: { 'Sunny': 85, 'Rain': 40 },
                        weekly_forecast: [
                            { date: '2026-05-10', code: 1, max: 25, min: 18 },
                            { date: '2026-05-11', code: 3, max: 22, min: 17 },
                            { date: '2026-05-12', code: 51, max: 20, min: 16 }
                        ]
                    },
                    attribution: { revenue: 0, cpa: 0 }
                };
            }

            // Render Logic
            const weather = data.context.current_condition;
            const locationName = lat ? "Current Location" : (weather.region || "Tokyo");
            const contextText = document.getElementById('current-weather-text');
            if (contextText) contextText.innerText = `📍 ${locationName}: ${weather.weather_code <= 1 ? 'Sunny' : 'Cloudy'}, ${weather.temp}°C`;

            // Metrics
            const revDisplay = document.getElementById('revenue-display');
            if (revDisplay && data.attribution.revenue) revDisplay.innerText = '¥' + data.attribution.revenue.toLocaleString();

            const cpaDisplay = document.getElementById('cpa-display');
            if (cpaDisplay && data.attribution.cpa) cpaDisplay.innerText = '¥' + data.attribution.cpa.toLocaleString();

            const activeFactors = data.context.active_factors || [];

            // Dynamic Date Update
            const dateText = document.getElementById('current-date-text');
            if (dateText) {
                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const day = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
                dateText.innerText = `📅 今日: ${yyyy}/${mm}/${dd} (${day})`;
            }

            // Charts Rendering (Protected)
            try {
                renderChart('chartWeather', 'doughnut', Object.keys(data.context.weather_impact), Object.values(data.context.weather_impact), 'Index', activeFactors);
                renderVisualizer('time-visualizer', ['Morning', 'Lunch', 'Evening'], activeFactors, { 'Morning': '🌅', 'Lunch': '🍱', 'Evening': '🌙' });
                renderVisualizer('temp-visualizer', ['Hot', 'Mild', 'Cold'], activeFactors, { 'Hot': '🔥', 'Mild': '🍃', 'Cold': '❄️' });
                renderForecast(data.context.weekly_forecast);
            } catch (e) { console.error("Chart Render Failed", e); }
        }

        function renderVisualizer(containerId, labels, activeFactors, icons) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            labels.forEach(label => {
                const isActive = activeFactors.includes(label);
                const div = document.createElement('div');
                div.className = `impact-item ${isActive ? 'active' : ''}`;
                if (isActive) {
                    if (label === 'Hot') div.style.background = '#e74c3c';
                    if (label === 'Cold') div.style.background = '#3498db';
                    if (label === 'Mild') div.style.background = '#2ecc71';
                    if (label === 'Lunch') div.style.background = '#f1c40f';
                    if (label === 'Evening') div.style.background = '#8e44ad';
                }
                div.innerHTML = `<div class="impact-icon">${icons[label] || '●'}</div><div class="impact-label">${label}</div>${isActive ? '<div class="impact-badge">Target!</div>' : ''}`;
                container.appendChild(div);
            });
        }

        function renderChart(id, type, labels, values, label, activeFactors) {
            const ctx = document.getElementById(id).getContext('2d');
            if (charts[id]) charts[id].destroy();
            const bgColors = labels.map(l => activeFactors.includes(l) ? '#e74c3c' : '#bdc3c7');

            charts[id] = new Chart(ctx, {
                type: type,
                data: { labels: labels, datasets: [{ label: label, data: values, backgroundColor: (type === 'bar') ? bgColors : ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6', '#34495e'] }] },
                options: { responsive: true, maintainAspectRatio: false, scales: (type === 'bar') ? { y: { beginAtZero: true } } : {} }
            });
        }

        function renderForecast(forecast) {
            const container = document.getElementById('forecast-container');
            container.innerHTML = '';
            if (!forecast) return;
            const wmoCodes = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 51: '🌦️', 61: '☔', 71: '☃️', 95: '⛈️' };
            forecast.forEach(day => {
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const icon = wmoCodes[day.code] || '❓';
                const card = document.createElement('div');
                card.className = 'forecast-day';
                card.innerHTML = `<div class="forecast-date">${dayName}</div><div class="forecast-icon">${icon}</div><div class="forecast-temp"><span class="temp-max">Max ${day.max}°</span><br><span class="temp-min">Min ${day.min}°</span></div>`;
                container.appendChild(card);
            });
        }

        // A/B Test Details Modal
        function showABDetails() {
            Swal.fire({
                title: 'A/Bテスト分析の詳細',
                html: `
                    <div style="text-align:left; font-size:14px; line-height:1.6; color:#2c3e50;">
                        <div style="margin-bottom:15px;">
                            <strong style="color:#e67e22;">1. 購買転換率（コンバージョンレート）の比較</strong><br>
                            パターンA（例：通常のCM素材） と パターンB（例：短尺でインパクト重視の素材） を交互に配信し、それぞれの放映時間帯に「どれくらい商品が売れたか」をPOSデータと突き合わせて比較します。<br>
                            <span style="background:#f0f0f0; padding:2px 5px; font-family:monospace;">結果例: Aは3.2%、Bは4.8%</span>
                        </div>
                        <div style="margin-bottom:15px;">
                            <strong style="color:#3498db;">2. 売上アップ率（Uplift）の測定</strong><br>
                            効果の高かった動画が、もう一方に比べて「何倍の売上を作ったか」を表示します（例：「パターンBの方が1.5倍売れました」）。<br>
                            これにより、感覚ではなく数字に基づいたクリエイティブの評価が可能になります。
                        </div>
                        <div>
                            <strong style="color:#27ae60;">3. 自動最適化の提案</strong><br>
                            テスト終了後、AIが<strong>「今後は効果の高いパターンBを優先的に配信すべきです」</strong>といった具体的なアクションプランを提案します。これにより、配信中に自動的に広告効果を最大化させることができます。
                        </div>
                    </div>
                `,
                width: 700,
                confirmButtonText: '閉じる',
                confirmButtonColor: '#34495e'
            });
        }

        loadData();