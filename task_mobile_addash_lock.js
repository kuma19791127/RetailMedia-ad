const fs = require('fs');
const path = 'C:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html';
let t = fs.readFileSync(path, 'utf8');

const target = `async function simulateUpload(aspectRatio, ytUrl = null, variant = null, ingredients = null, isImage = false) {`;
const repl = target + `
            Swal.fire({ title: '🤖 Google AI 審査中...', html: '配信コンテンツの安全性をリアルタイム解析しています...<br><span style="font-size:0.8rem; color:#aaa;">Powered by Google Cloud Vertex AI</span>', showConfirmButton: false, allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
            try {
                const reviewRes = await fetch('/api/creator/review-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video_base64: 'mock_data' }) });
                const reviewData = await reviewRes.json();
                if (!reviewData.safe) {
                    Swal.fire({ title: '❌ 審査不合格 (アカウント制限)', html: '<div style="color:red;font-size:0.9rem;text-align:left;">' + reviewData.message + '<br><br><b>アカウントの一部機能がロックされました。</b><br>配信を再開するには解除申請を行ってください。</div>', icon: 'error' });
                    return;
                }
            } catch(e) { console.error('Review Error:', e); }
`;

if (t.includes(target)) {
    if (!t.split(target)[1].startsWith("\n            Swal.fire({ title: '🤖 Google AI 審査中...'")) {
        t = t.replace(target, repl);
        fs.writeFileSync(path, t);
        console.log("Patched simulateUpload correctly.");
    } else {
        console.log("simulateUpload already patched.");
    }
} else {
    console.log("Target not found.");
}
