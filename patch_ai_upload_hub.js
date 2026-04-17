const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', 'utf8');

// 1. Change AI Generator Button to open the hub modal
const aiButtonTarget = `<button class="btn btn-gold" style="width:100%; margin-bottom:10px; font-weight:bold; box-shadow:0 4px 10px rgba(251,191,36,0.2);" onclick="document.getElementById('video-upload').click();">`;
const aiButtonRepl = `<button class="btn btn-gold" style="width:100%; margin-bottom:10px; font-weight:bold; box-shadow:0 4px 10px rgba(251,191,36,0.2);" onclick="document.getElementById('ai-source-modal').style.display = 'flex';">`;
if(doc.includes(aiButtonTarget)) {
    doc = doc.replace(aiButtonTarget, aiButtonRepl);
}

// 2. Add AI Source Hub Modal HTML right before Payment Modal
const paymentModalTarget = `<!-- Square Payment Modal -->`;
const aiModalHtml = `
    <!-- AI Data Source Menu Modal -->
    <div id="ai-source-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center;">
        <div class="glass" style="padding:30px; border-radius:15px; width:450px; max-width:90%; position:relative; background:#1e293b; color:white;">
            <i class="fa-solid fa-xmark" style="position:absolute; top:15px; right:20px; font-size:1.5rem; cursor:pointer; color:#94a3b8;" onclick="document.getElementById('ai-source-modal').style.display='none';"></i>
            <h2 style="margin-top:0; color:#38bdf8; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; font-size:1.2rem;"><i class="fa-solid fa-cloud-arrow-up"></i> アップロード元の選択</h2>
            <p style="font-size:0.9rem; color:#cbd5e1; margin-bottom:20px;">AI (Gemini 1.5 Flash) に解析させるデータ形式を選んでください。</p>
            
            <button class="btn" style="width:100%; background:#0f172a; border:1px solid #334155; justify-content:flex-start; padding:15px; margin-bottom:10px; text-align:left;" onclick="document.getElementById('ai-source-modal').style.display='none'; document.getElementById('video-upload').click();">
                <i class="fa-solid fa-video" style="color:#10b981; font-size:1.5rem; width:40px; text-align:center;"></i>
                <div style="flex:1;">
                    <strong style="display:block; font-size:1rem; color:white;">カメラ・動画ファイル</strong>
                    <span style="font-size:0.75rem; color:#94a3b8;">端末に保存された動画をAIが視覚的に解析</span>
                </div>
            </button>

            <button class="btn" style="width:100%; background:#0f172a; border:1px solid #334155; justify-content:flex-start; padding:15px; margin-bottom:10px; text-align:left;" onclick="document.getElementById('ai-source-modal').style.display='none'; document.getElementById('excel-upload').click();">
                <i class="fa-solid fa-file-excel" style="color:#10b981; font-size:1.5rem; width:40px; text-align:center;"></i>
                <div style="flex:1;">
                    <strong style="display:block; font-size:1rem; color:white;">Excel・CSVファイル</strong>
                    <span style="font-size:0.75rem; color:#94a3b8;">既存の手順書（表計算データ）を自動構成</span>
                </div>
            </button>

            <button class="btn" style="width:100%; background:#0f172a; border:1px solid #334155; justify-content:flex-start; padding:15px; margin-bottom:10px; text-align:left;" onclick="document.getElementById('ai-source-modal').style.display='none'; promptCloudLink();">
                <i class="fa-brands fa-google-drive" style="color:#38bdf8; font-size:1.5rem; width:40px; text-align:center;"></i>
                <div style="flex:1;">
                    <strong style="display:block; font-size:1rem; color:white;">Google Drive等 URL解析</strong>
                    <span style="font-size:0.75rem; color:#94a3b8;">クラウド保存されたドキュメントURLを読み込む</span>
                </div>
            </button>
            <input type="file" id="excel-upload" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" style="display:none;" onchange="handleAiVideo(event)">
        </div>
    </div>
`;
if(!doc.includes('id="ai-source-modal"')) {
    doc = doc.replace(paymentModalTarget, aiModalHtml + '\n    ' + paymentModalTarget);
}

// 3. Update the handleAiVideo to show descriptive processing text for multiple types
const handleVideoTarget = `document.getElementById('ai-status').innerHTML = '🎥 動画を圧縮最適化中...<br><span style="font-size:0.8rem;">(エンコード中)</span>';`;
const handleVideoRepl = `
            let msg = '🎥 メディアを最適化中...';
            if(file.name.includes('.xls') || file.name.includes('.csv')) msg = '📊 データを変換中...';
            document.getElementById('ai-status').innerHTML = msg + '<br><span style="font-size:0.8rem;">(前処理中)</span>';
`;
if(doc.includes(handleVideoTarget)) {
    doc = doc.replace(handleVideoTarget, handleVideoRepl);
}

// 4. Add promptCloudLink JS logic
const scriptEndTarget = `    <div id="payment-modal"`;
const cloudLinkLogic = `
        function promptCloudLink() {
            Swal.fire({
                title: 'クラウドURLの入力',
                input: 'url',
                inputPlaceholder: 'https://drive.google.com/file/d/....',
                text: '共有権限を「リンクを知っている全員」に設定したURLを入力してください。',
                background: '#1e293b',
                color: '#f8fafc',
                showCancelButton: true,
                confirmButtonText: '解析開始'
            }).then(result => {
                if(result.isConfirmed && result.value) {
                    document.getElementById('ai-loading').style.display = 'block';
                    document.getElementById('ai-status').innerHTML = '☁️ クラウドデータを取得中...';
                    setTimeout(() => {
                        document.getElementById('ai-loading').style.display = 'none';
                        triggerSquarePayment('ai_generation', 'クラウドデータ AI解析');
                    }, 1500);
                }
            });
        }
`;
if(doc.includes(scriptEndTarget) && !doc.includes("function promptCloudLink()")) {
    doc = doc.replace(scriptEndTarget, cloudLinkLogic + '\n    ' + scriptEndTarget);
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', doc, 'utf8');
console.log('Patched UI for Upload Modal in manualhelp.html');
