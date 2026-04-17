const fs = require('fs');
const pathStr = 'C:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html';
let t = fs.readFileSync(pathStr, 'utf8');

const targetStr = `<button type="submit" class="btn-primary" style="padding:10px 20px;">設定を保存・同期する</button>`;
const replacementStr = `<button type="submit" class="btn-primary" style="padding:10px 20px;">設定を保存・同期する</button>
                                <button type="button" onclick="requestUnlock()" style="padding:10px 20px; font-size:14px; background:#f43f5e; color:white; border:none; border-radius:8px; cursor:pointer; margin-left:10px;">🆘 アカウントロック解除申請</button>`;

t = t.replace(targetStr, replacementStr);

const funcStr = `
    function requestUnlock() {
        Swal.fire({
            title: 'アカウントロック解除申請',
            text: 'AI審査により不適切と判定された広告を削除/修正しましたか？運営(Review)へ解除申請を送信します。',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#9ca3af',
            confirmButtonText: 'はい、申請します'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch('/api/review/unlock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ creatorId: document.getElementById('prof-email') ? document.getElementById('prof-email').value || '広告主' : '広告主' })
                }).then(res => res.json()).then(data => {
                    if (data.success) {
                        Swal.fire('申請完了', '運営チーム(Review)へアカウントロック解除申請が送信されました。確認まで1〜2営業日お待ちください。', 'success');
                    } else {
                        Swal.fire('エラー', '申請の送信に失敗しました', 'error');
                    }
                }).catch(e => {
                    Swal.fire('エラー', '通信に失敗しました', 'error');
                });
            }
        });
    }
`;

if (t.indexOf("function requestUnlock()") === -1) {
    t = t.replace("</script>\n</body>", funcStr + "</script>\n</body>");
}

fs.writeFileSync(pathStr, t);
console.log("Patched ad_dashboard");
