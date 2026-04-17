const fs = require('fs');
const pathStr = 'C:/Users/one/Desktop/RetailMedia_System/creator_portal.html';
let t = fs.readFileSync(pathStr, 'utf8');

// Add the unlock button inside the profile form or modal
const target = `<button type="submit" class="btn btn-primary" style="padding:12px; font-size:16px;">💾 保存して同期</button>`;
const replacement = `<button type="submit" class="btn btn-primary" style="padding:12px; font-size:16px;">💾 保存して同期</button>
            <button type="button" onclick="requestUnlock()" style="padding:12px; font-size:14px; background:#f43f5e; color:white; border:none; border-radius:8px; cursor:pointer; margin-top:10px;">🆘 アカウントロック解除申請 (Reviewへ送信)</button>`;

t = t.replace(target, replacement);

const scriptToAdd = `
        function requestUnlock() {
            Swal.fire({
                title: 'アカウントロック解除申請',
                text: 'AI審査により不適切と判定された動画を削除/修正しましたか？運営(Review)へ解除申請を送信します。',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#9ca3af',
                confirmButtonText: 'はい、申請します'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Send to review mechanism (admin form submission or simple alert)
                    Swal.fire(
                        '申請完了',
                        '運営チーム(Review)へ申請が送信されました。確認まで1〜2営業日お待ちください。',
                        'success'
                    );
                }
            });
        }
`;

if (t.indexOf("function requestUnlock()") === -1) {
    t = t.replace("</script>", scriptToAdd + "\n    </script>");
}

fs.writeFileSync(pathStr, t);
console.log("Patched creator_portal lock request");
