const fs = require('fs');
const pathStr = 'C:/Users/one/Desktop/RetailMedia_System/creator_portal.html';
let t = fs.readFileSync(pathStr, 'utf8');

const targetStr = `                if (result.isConfirmed) {
                    // Send to review mechanism (admin form submission or simple alert)
                    Swal.fire(
                        '申請完了',
                        '運営チーム(Review)へ申請が送信されました。確認まで1〜2営業日お待ちください。',
                        'success'
                    );
                }`;

const replacementStr = `                if (result.isConfirmed) {
                    fetch(API_BASE + '/api/review/unlock', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ creatorId: 'クリエイター' })
                    }).then(res => res.json()).then(data => {
                        if (data.success) {
                            Swal.fire('申請完了', '運営チーム(Review)へアカウントロック解除申請が送信されました。確認まで1〜2営業日お待ちください。', 'success');
                        } else {
                            Swal.fire('エラー', '申請の送信に失敗しました', 'error');
                        }
                    });
                }`;

t = t.replace(targetStr, replacementStr);
fs.writeFileSync(pathStr, t);
console.log("Patched creator_portal API call");
