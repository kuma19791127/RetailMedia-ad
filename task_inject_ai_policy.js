const fs = require('fs');

const POLICY_SCRIPT = `
    <!-- AI Moderation Policy Script -->
    <script>
        function showAdPolicy() {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '配信・広告審査基準 (AI Moderation)',
                    html: '<div style="text-align:left; font-size:0.95rem; line-height:1.6; color:#333;">以下に該当する不適切なコンテンツが含まれている配信・広告は、AIによって自動的に拒絶される可能性があります。<br><br><b>1:</b> 過度な暴力、性的描写、ヘイトスピーチ等の公序良俗に反する内容。<br><b>2:</b> 「必ず儲かる」「投資で稼ぐ」といった投資詐欺・誇大広告。<br><b>3:</b> 「続きはLINEで」「LINE登録はこちら」などのLINEや外部SNSへ誘導し情報商材を売るようなスパム・詐欺的誘導。</div>',
                    icon: 'info',
                    confirmButtonText: '確認しました'
                });
            } else {
                alert("以下に該当する不適切なコンテンツが含まれている配信・広告は、AIに拒否されます。\\n\\n1: 暴力、性的描写、ヘイトスピーチ等\\n2: 投資詐欺・誇大広告\\n3: LINE等への詐欺的誘導");
            }
        }
    </script>
`;

function injectPolicy(html) {
    if (!html.includes('showAdPolicy()')) {
        return html.replace('</body>', `${POLICY_SCRIPT}\n</body>`);
    }
    return html;
}

// 1. UPDATE CREATOR PORTAL
let cpBody = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/creator_portal.html', 'utf8');
cpBody = injectPolicy(cpBody);
cpBody = cpBody.replace(
    '<h2>📤 新規ショート動画アップロード</h2>',
    '<h2>📤 新規ショート動画アップロード <a href="javascript:void(0)" onclick="showAdPolicy()" style="font-size:0.9rem; font-weight:normal; color:#3498db; text-decoration:underline;">[配信・広告基準]</a></h2>'
);
fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/creator_portal.html', cpBody, 'utf8');


// 2. UPDATE AD_DASHBOARD & ADVERTISER_DASHBOARD
const dashboards = ['C:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html', 'C:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html'];

const oldSubmitBlock = `                if (result.isConfirmed) {
                    // Collect targeting
                    let targetInfo = "";
                    if (plan === 'moment') targetInfo = "（トリガー: " + document.getElementById('swal-trigger').value + "）";
                    if (plan === 'impression') targetInfo = "（目標再生: " + document.getElementById('swal-target').value + "回）";
                    if (plan === 'cpa') targetInfo = "（目標CPA: ¥" + document.getElementById('swal-cpa-target').value + "）";

                    let brandNameForMail = window.currentUser ? window.currentUser.email : 'Unknown Brand';
                    const brandEl = document.getElementById('brand-name');
                    if (brandEl && brandEl.innerText !== 'My Brand') {
                        brandNameForMail = brandEl.innerText + " (" + brandNameForMail + ")";
                    }

                    const formValues = {
                        name: name,
                        budget: budget,
                        plan: plan,
                        extra: targetInfo,
                        brand: brandNameForMail
                    };

                    // Execute API via standard path
                    fetch(API_URL + '/api/ads/campaign', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formValues)
                    }).then(res => res.json()).then(data => {
                        let msg = \`キャンペーン「\${formValues.name}」を作成しました。\${targetInfo}<br>審査通過後、配信が開始されます。\`;
                        if (data && data.budgetInfo) {
                            msg += "<br><span style='font-size:12px;color:red;'>" + data.budgetInfo + "</span>";
                        }
                        
                        Swal.fire({
                            icon: 'success',
                            title: 'キャンペーン作成完了',
                            html: msg
                        }).then(() => {
                            fetchDashboardStats();
                        });
                    }).catch(err => {
                        Swal.fire('エラー', 'キャンペーンの作成に失敗しました', 'error');
                    });
                }`;

const newSubmitBlock = `                if (result.isConfirmed) {
                    const runCampaignRegistration = () => {
                        // Collect targeting
                        let targetInfo = "";
                        if (plan === 'moment') targetInfo = "（トリガー: " + document.getElementById('swal-trigger').value + "）";
                        if (plan === 'impression') targetInfo = "（目標再生: " + document.getElementById('swal-target').value + "回）";
                        if (plan === 'cpa') targetInfo = "（目標CPA: ¥" + document.getElementById('swal-cpa-target').value + "）";
    
                        let brandNameForMail = window.currentUser ? window.currentUser.email : 'Unknown Brand';
                        const brandEl = document.getElementById('brand-name');
                        if (brandEl && brandEl.innerText !== 'My Brand') {
                            brandNameForMail = brandEl.innerText + " (" + brandNameForMail + ")";
                        }
    
                        const formValues = {
                            name: name,
                            budget: budget,
                            plan: plan,
                            extra: targetInfo,
                            brand: brandNameForMail
                        };
    
                        // Execute API via standard path
                        fetch(API_URL + '/api/ads/campaign', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(formValues)
                        }).then(res => res.json()).then(data => {
                            let msg = \`キャンペーン「\${formValues.name}」を作成しました。\${targetInfo}<br>配信が開始されます。\`;
                            if (data && data.budgetInfo) {
                                msg += "<br><span style='font-size:12px;color:red;'>" + data.budgetInfo + "</span>";
                            }
                            
                            Swal.fire({
                                icon: 'success',
                                title: 'キャンペーン作成完了',
                                html: msg
                            }).then(() => {
                                if (typeof fetchDashboardStats === 'function') fetchDashboardStats();
                            });
                        }).catch(err => {
                            Swal.fire('エラー', 'キャンペーンの作成に失敗しました', 'error');
                        });
                    };

                    // --- AI REVIEW PROCESS START ---
                    const fileInput = document.getElementById('swal-file');
                    if (fileInput && fileInput.files && fileInput.files.length > 0) {
                        Swal.fire({
                            title: '🤖 Google AI 審査中...',
                            html: '動画/画像の安全性をAIが解析しています...<br><span style="font-size:0.8rem; color:#aaa;">Powered by Google Cloud Vertex AI</span>',
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            didOpen: () => { Swal.showLoading(); }
                        });
                        
                        const file = fileInput.files[0];
                        const reader = new FileReader();
                        reader.onload = async () => {
                            try {
                                const reviewRes = await fetch(API_URL + '/api/creator/review-content', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ video_base64: reader.result })
                                });
                                const reviewData = await reviewRes.json();
                                
                                if (!reviewData.safe) {
                                    Swal.fire({
                                        title: '❌ 配信審査不合格',
                                        html: '<div style="color:red;font-size:0.9rem;text-align:left;">' + reviewData.message + '</div><br><span style="font-size:10px;">※審査基準により広告配信をお断りしました。</span>',
                                        icon: 'error'
                                    });
                                } else {
                                    Swal.fire({
                                        title: '✅ 審査通過',
                                        html: 'ガイドラインをクリアしました。<br><span style="font-size:0.8rem;color:#888;">AI判定: ' + reviewData.message.substring(0,40) + '...</span>',
                                        icon: 'success',
                                        timer: 1500,
                                        showConfirmButton: false
                                    }).then(() => {
                                        runCampaignRegistration();
                                    });
                                }
                            } catch (e) {
                                console.error(e);
                                Swal.fire('エラー', 'AI審査システムに接続できませんでした。', 'error');
                            }
                        };
                        reader.readAsDataURL(file);
                    } else {
                        // モックなのでそのまま登録
                        runCampaignRegistration();
                    }
                    // --- AI REVIEW PROCESS END ---
                }`;


dashboards.forEach(file => {
    try {
        let dbBody = fs.readFileSync(file, 'utf8');
        dbBody = injectPolicy(dbBody);
        
        // Header
        dbBody = dbBody.replace(
            '<h1 style="margin:0;">📢 キャンペーン管理</h1>',
            '<div style="display:flex; align-items:baseline;"><h1 style="margin:0;">📢 キャンペーン管理</h1> <a href="javascript:void(0)" onclick="showAdPolicy()" style="font-size:0.9rem; font-weight:normal; color:#3498db; text-decoration:underline; margin-left:15px;">[配信・広告基準]</a></div>'
        );

        // Replace upload logic block if it exists
        if (dbBody.includes("if (plan === 'moment') targetInfo =")) {
            // Because the block is large, let's use a regex that captures everything inside the if (result.isConfirmed) block for initiateCampaign
            const startIdx = dbBody.indexOf("                if (result.isConfirmed) {", dbBody.indexOf("function initiateCampaign"));
            
            // The block ends right before "});\n        }" of initiateCampaign
            if (startIdx > -1) {
                const searchRegion = dbBody.substring(startIdx, startIdx + 8000);
                const endMatch = searchRegion.match(/\}\);\s*\}\);\s*\}/); // Looks for the closure
                
                if (endMatch) {
                    // Safe injection
                    // Instead of regex, if exact text replace works:
                    if (dbBody.indexOf(oldSubmitBlock) !== -1) {
                        dbBody = dbBody.replace(oldSubmitBlock, newSubmitBlock);
                    } else {
                        console.log("Could not exact-match oldSubmitBlock in " + file);
                    }
                }
            }
        }
        
        fs.writeFileSync(file, dbBody, 'utf8');
        console.log("Updated AI logic inside " + file);
    } catch(err) {
        console.log("Error processing " + file + ":", err);
    }
});
