function requestUnlock() {
            Swal.fire({
                title: 'アカウントロック解除申請',
                text: 'AI審査により不適切と判定された動画を削除/修正しましたか？運営審査部門 (Review) へ解除申請を送信します。',
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
                        body: JSON.stringify({ email: localStorage.getItem('demo_email') || 'advertiser@demo.com', target: 'Review' })
                    }).then(res => res.json()).then(data => {
                        Swal.fire('送信完了', 'Review部門へアカウントロック解除を申請しました。後日審査されます。', 'success');
                    }).catch(e => {
                        Swal.fire('送信完了', 'Review部門へアカウントロック解除を申請しました。(モック)', 'success');
                    });
                }
            });
        }