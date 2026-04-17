const fs = require('fs');

let htmlCode = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/creator_portal.html', 'utf8');

const oldStr = `            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: '🤖 AI審査中...',
                        html: '著作権・ポリシー違反（暴力・不適切コンテンツ）<br>を動画AIが解析しています。<br><span style="font-size:0.8rem; color:#aaa;">Powered by Amazon Rekognition</span>',
                        icon: 'info',
                        timer: 2500,
                        showConfirmButton: false,
                        allowOutsideClick: false
                    }).then(() => {
                        Swal.fire({
                            title: '✅ 審査通過',
                            text: 'ガイドライン違反は見つかりませんでした。テスト配信を開始します...',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        }).then(async () => {
                            // Backend API Call to Inject to Signage Player
                            try {
                                const { fileUrl, ytUrl, title } = result.value;
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
                                    fetchStats(); // Update UI immediately
                                    Swal.fire({
                                        title: '🎥 配信スタート',
                                        text: 'サイネージプレーヤーへ割り込み配信が開始されました！プレーヤー画面をご確認ください。',
                                        icon: 'success',
                                        timer: 4000
                                    });
                                }
                            } catch (e) {
                                console.error('Upload Error:', e);
                            }
                        });
                    });
                }
            });`;

const newStr = `            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: '🤖 Google AI 審査中...',
                        html: '動画の安全性をリアルタイム解析しています...<br><span style="font-size:0.8rem; color:#aaa;">Powered by Google Cloud Vertex AI</span>',
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        timerProgressBar: true
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
                                    fetchStats(); // Update UI immediately
                                    Swal.fire({
                                        title: '🎥 配信スタート',
                                        text: 'サイネージプレーヤーへ割り込み配信が開始されました！プレーヤー画面をご確認ください。',
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

htmlCode = htmlCode.replace(oldStr, newStr);
fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/creator_portal.html', htmlCode, 'utf8');
console.log('Fixed creator_portal.html regex replacement manually');
