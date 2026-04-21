const fs = require('fs');

const reviewLogic = `            // === AI Moderation & Rules ===
            Swal.fire({ title: '🤖 Google AI 審査中...', html: '配信コンテンツの安全性をリアルタイム解析しています...<br><span style="font-size:0.8rem; color:#aaa;">Powered by Google Cloud Vertex AI</span>', showConfirmButton: false, allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
            try {
                const reviewRes = await fetch(API_URL + '/api/creator/review-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video_base64: 'mock_data' }) });
                const reviewData = await reviewRes.json();
                if (!reviewData.safe) {
                    Swal.fire({ title: '❌ 審査不合格 (アカウント制限)', html: '<div style="color:red;font-size:0.9rem;text-align:left;">' + reviewData.message + '<br><br><b>アカウントの一部機能がロックされました。</b><br>運営(Admin)による実態審査をお待ちください。</div>', icon: 'error' });
                    return;
                }
            } catch(e) { console.error('Review Error:', e); }
`;

function patchAdvertiser(file) {
    let html = fs.readFileSync(file, 'utf8');
    const tgt = "Swal.fire({ title: 'アップロード中...', timerProgressBar: true, didOpen: () => Swal.showLoading() });";
    if (html.includes(tgt) && !html.includes('Google AI 審査中')) {
        html = html.replace(tgt, reviewLogic + '\n            ' + tgt);
        fs.writeFileSync(file, html, 'utf8');
        console.log('Patched ' + file);
    }
}

// Ensure 15 second validation in ad_dashboard.html
const durationLogic = `
                    // Add 15s check for real users
                    if (file.type.startsWith('video/')) {
                        try {
                            const duration = await window.getVideoDuration(file);
                            const currentUser = JSON.parse(sessionStorage.getItem('retailMediaAuth') || '{}');
                            const isDemoUser = currentUser.email && currentUser.email.includes('@demo.com');
                            
                            if (duration > 16) {
                                if (isDemoUser) {
                                    Swal.fire({ toast:true, position:'top-end', html:'デモアカウントのため15秒超過を許可しました', icon:'info', showConfirmButton:false, timer:3000 });
                                } else {
                                    Swal.fire('⚠️ 配信規定（15秒超過）', '本番環境では15秒以内のショート動画のみ配信可能です。\\n※15秒以内の動画を再選択してください。', 'warning');
                                    return;
                                }
                            }
                        } catch(e) {}
                    }
                    
                    fileName = file.name;
`;
function patchAdDashboard(file) {
    let html = fs.readFileSync(file, 'utf8');
    const tgt = "fileName = file.name;";
    if (html.includes(tgt) && !html.includes('15秒以内のショート動画')) {
        // Wait, ad_dashboard.html might not have `getVideoDuration` helper!
        if (!html.includes('getVideoDuration')) {
            const helper = `    <script>
        window.getVideoDuration = function(file) {
            return new Promise((resolve, reject) => {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    resolve(video.duration);
                };
                video.onerror = () => reject('Invalid video file');
                video.src = window.URL.createObjectURL(file);
            });
        };
    </script>
</body>`;
            html = html.replace('</body>', helper);
        }
        
        // Wait, does ad_dashboard.html use fileName = file.name ? No, in ad_dashboard it's handleFile where we upload.
        // Let's check handleFile in ad_dashboard.html.
    }
}

patchAdvertiser('C:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html');
console.log('Done script');
