const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', 'utf8');

// ==== FIX 1: The info link disappearing issue ====
// The previous patch failed to match because the string had slightly different spacing or attributes. Let's make it robust using regex.
const h3Regex = /<h3 style="color:#fbbf24; font-size:1rem; margin-bottom:15px;"><i class="fa-solid fa-robot"><\/i> 高度なAI処理 <span style="font-size:0.8rem; background:#fbbf24; color:#0f172a; padding:2px 6px; border-radius:4px; margin-left:5px;">有料<\/span><\/h3>/;
if (h3Regex.test(doc)) {
    const replacement = `<h3 style="color:#fbbf24; font-size:1rem; margin-bottom:5px; display:inline-block;"><i class="fa-solid fa-robot"></i> 高度なAI処理 <span style="font-size:0.8rem; background:#fbbf24; color:#0f172a; padding:2px 6px; border-radius:4px; margin-left:5px;">有料</span></h3>
                            <div style="text-align: right; margin-bottom:15px;">
                                <a href="#" onclick="showAiDetails(); return false;" style="color:#60a5fa; font-size:0.85rem; text-decoration:underline; display:inline-flex; align-items:center; gap:4px;"><i class="fa-solid fa-circle-info"></i> 詳細はこちら</a>
                            </div>`;
    doc = doc.replace(h3Regex, replacement);
}


// ==== FIX 2: File Preview Modal before Payment ====
// Right now, handleAiVideo sets pendingVideoBase64 and triggers triggerSquarePayment directly.
// We need to intercept this and show a confirm dialog.

const originalHandleAiLogic = `                setTimeout(() => {
                    document.getElementById('ai-loading').style.display = 'none';
                    triggerSquarePayment('ai_generation', 'AI動画解析 (Video Intelligence)');
                    document.getElementById('video-upload').value = '';
                }, 1500);`;

const newConfirmLogic = `                setTimeout(() => {
                    document.getElementById('ai-loading').style.display = 'none';
                    
                    // Show Confirmation Modal before Payment
                    let typeIcon = file.name.includes('.xls') || file.name.includes('.csv') ? '📊' : '🎥';
                    let typeName = file.name.includes('.xls') || file.name.includes('.csv') ? '表計算データ' : '動画ファイル';
                    let fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                    
                    Swal.fire({
                        title: 'アップロード準備完了',
                        html: \`
                            <div style="text-align:left; background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:10px;">
                                <div style="color:#94a3b8; font-size:0.8rem; margin-bottom:5px;">選択されたファイル</div>
                                <div style="color:white; font-size:1rem; font-weight:bold; word-break:break-all;"><i class="fa-solid fa-file"></i> \${file.name}</div>
                                <div style="color:#38bdf8; font-size:0.85rem; margin-top:5px;">種類: \${typeIcon} \${typeName}</div>
                                <div style="color:#cbd5e1; font-size:0.85rem; margin-top:2px;">サイズ: \${fileSizeMB} MB</div>
                            </div>
                            <p style="font-size:0.9rem; color:#e2e8f0;">このデータを使用して、Gemini AIに解析をリクエストしマニュアルの自動生成を開始します。よろしいですか？</p>
                        \`,
                        icon: 'info',
                        background: '#1e293b',
                        color: '#f8fafc',
                        showCancelButton: true,
                        confirmButtonText: '<i class="fa-solid fa-check"></i> 決済してAIを実行',
                        cancelButtonText: 'キャンセル',
                        confirmButtonColor: '#10b981'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            triggerSquarePayment('ai_generation', 'AI高度自動生成');
                        } else {
                            pendingVideoBase64 = null; // Clear if cancelled
                        }
                        
                        document.getElementById('video-upload').value = '';
                        const excelEl = document.getElementById('excel-upload');
                        if (excelEl) excelEl.value = '';
                    });
                }, 1500);`;

if (doc.includes(originalHandleAiLogic)) {
    doc = doc.replace(originalHandleAiLogic, newConfirmLogic);
}

// Ensure promptCloudLink also gets a confirmation step
const originalCloudLogic = `                if(result.isConfirmed && result.value) {
                    document.getElementById('ai-loading').style.display = 'block';
                    document.getElementById('ai-status').innerHTML = '☁️ クラウドデータを取得中...';
                    setTimeout(() => {
                        document.getElementById('ai-loading').style.display = 'none';
                        triggerSquarePayment('ai_generation', 'クラウドデータ AI解析');
                    }, 1500);
                }`;

const newCloudLogic = `                if(result.isConfirmed && result.value) {
                    document.getElementById('ai-loading').style.display = 'block';
                    document.getElementById('ai-status').innerHTML = '☁️ クラウドURLを確認中...';
                    setTimeout(() => {
                        document.getElementById('ai-loading').style.display = 'none';
                        
                        Swal.fire({
                            title: 'URL確認完了',
                            html: \`
                                <div style="text-align:left; background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:10px;">
                                    <div style="color:#94a3b8; font-size:0.8rem; margin-bottom:5px;">対象のクラウドリンク</div>
                                    <div style="color:#38bdf8; font-size:0.9rem; word-break:break-all; text-decoration:underline;">\${result.value}</div>
                                </div>
                                <p style="font-size:0.9rem; color:#e2e8f0;">このURL先のデータへアクセスし、自動生成を開始してもよろしいですか？</p>
                            \`,
                            icon: 'info',
                            background: '#1e293b',
                            color: '#f8fafc',
                            showCancelButton: true,
                            confirmButtonText: '<i class="fa-solid fa-check"></i> 決済してAIを実行',
                            cancelButtonText: 'キャンセル',
                            confirmButtonColor: '#10b981'
                        }).then((confResult) => {
                            if (confResult.isConfirmed) {
                                triggerSquarePayment('ai_generation', 'クラウドデータ AI解析');
                            }
                        });
                    }, 1500);
                }`;

if (doc.includes(originalCloudLogic)) {
    doc = doc.replace(originalCloudLogic, newCloudLogic);
}


fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', doc, 'utf8');
console.log('Fixed link rendering issue and added Preview/Confirm step before firing square payment.');
