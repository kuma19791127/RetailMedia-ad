const fs = require('fs');
let html = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/creator_portal.html', 'utf8');

// Replace the specific Swal.fire block
const regex = /Swal\.fire\(\{\s*title:\s*'🤖\s*AI審査中\.\.\.',\s*html:\s*'著作権・ポリシー違反（暴力・不適切コンテンツ）<br>を動画AIが解析しています。<br><span style="font-size:0.8rem; color:#aaa;">Powered by Amazon Rekognition<\/span>',\s*icon:\s*'info',\s*timer:\s*2500,\s*showConfirmButton:\s*false,\s*allowOutsideClick:\s*false\s*\}\)\.then\(\(\)\s*=>\s*\{\s*Swal\.fire\(\{\s*title:\s*'✅\s*審査通過',\s*text:\s*'ガイドライン違反は見つかりませんでした。テスト配信を開始します\.\.\.',\s*icon:\s*'success',\s*timer:\s*2000,\s*showConfirmButton:\s*false\s*\}\)/g;

if(regex.test(html)) {
    console.log("Matched the fake AI logic! Replacing...");
} else {
    console.log("Could not find the fake AI logic using regex.");
}

// Let's just find the index of "Powered by Amazon Rekognition" and rewrite the whole block manually
const targetStr = "Powered by Amazon Rekognition";
const idx = html.indexOf(targetStr);

if (idx > -1) {
    // Find the enclosing "if (result.isConfirmed) {"
    const startIdx = html.lastIndexOf("if (result.isConfirmed) {", idx);
    // Find the end of the block
    const endIdx = html.indexOf("});\n                    });\n                }\n            });", idx) + 60;
    
    const newStr = `if (result.isConfirmed) {
                    Swal.fire({
                        title: '🤖 Google AI 審査中...',
                        html: '動画の安全性をリアルタイム解析しています...<br><span style="font-size:0.8rem; color:#aaa;">Powered by Google Cloud Vertex AI</span>',
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        didOpen: () => { Swal.showLoading(); }
                    });
                    
                    try {
                        const { fileUrl, ytUrl, title } = result.value;
                        
                        // Backend API Call for Moderation
                        const reviewRes = await fetch(API_BASE + '/api/creator/review-content', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ video_base64: fileUrl || "mock_data" })
                        });
                        const reviewData = await reviewRes.json();
                        
                        if (!reviewData.safe) {
                            Swal.fire({
                                title: '❌ 審査不合格',
                                html: '<div style="color:red;font-size:0.9rem;text-align:left;">' + reviewData.message + '</div>',
                                icon: 'error'
                            });
                            return;
                        }

                        Swal.fire({
                            title: '✅ 審査通過',
                            html: 'ガイドラインをクリアしました。<br><span style="font-size:0.8rem;color:#888;">AI判定: ' + reviewData.message.substring(0,40) + '...</span>',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        }).then(async () => {
                            try {
                                const res = await fetch(\`\${API_BASE}/api/creator/upload\`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        title: title,
                                        format: "縦型 (Shorts)",
                                        src: ytUrl || fileUrl
                                    })
                                });
                                if (res.ok) {
                                    fetchStats();
                                    Swal.fire({
                                        title: '🎥 配信スタート',
                                        text: 'サイネージプレーヤーへ割り込み配信が開始されました！',
                                        icon: 'success',
                                        timer: 4000
                                    });
                                }
                            } catch (e) {
                                console.error('Upload Error:', e);
                            }
                        });
                    } catch (err) {
                        Swal.fire('エラー', 'AIサーバーに接続できませんでした。', 'error');
                    }
                }
            });`;
            
    html = html.substring(0, startIdx) + newStr + html.substring(html.indexOf("function showBankSettings", endIdx) - 20); // clean cut
    
    // Also change `}).then((result) => {` to `}).then(async (result) => {`
    html = html.replace(/\}\)\.then\(\(result\) => \{/g, '}).then(async (result) => {');

    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/creator_portal.html', html, 'utf8');
}
