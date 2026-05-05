const fs = require('fs');
let html = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_player.html', 'utf8');

const watchdogScript = `
        // ==========================================
        // WATCHDOG FUNCTION (自己修復・無人運用・自動リロード)
        // ==========================================
        (function initWatchdog() {
            // 1. ネットワーク切断からの復帰時に自動リロード
            window.addEventListener('online', () => {
                console.log("[Watchdog] ネットワーク復帰検知。システムを正常化するために強制リロードします。");
                setTimeout(() => { location.reload(); }, 3000);
            });

            // 2. バックグラウンドでの深刻なJSエラー時にリロードを予約 (フリーズ回避)
            window.addEventListener('error', (e) => {
                console.error("[Watchdog] 未捕捉のエラー発生:", e.message);
                if (!window.errorReloadTimer) {
                    window.errorReloadTimer = setTimeout(() => {
                        console.warn("[Watchdog] エラーリカバリーのためリロードします...");
                        location.reload();
                    }, 120000); // 2分経っても回復しない場合は強制リロード
                }
            });

            // 3. 動画・サイネージが完全に停止（スタック）している場合の検知ループ
            let lastVidTime = -1;
            let stuckCounter = 0;
            setInterval(() => {
                const vid = document.getElementById('video-screen');
                if (vid && !vid.paused) {
                    if (vid.currentTime === lastVidTime) {
                        stuckCounter++;
                        // 10秒間同じフレームから動かない場合はバッファリングフリーズと判定
                        if (stuckCounter > 10) {
                            console.error("[Watchdog] ビデオフリーズを検知。ページを強制リロードします。");
                            location.reload();
                        }
                    } else {
                        lastVidTime = vid.currentTime;
                        stuckCounter = 0;
                    }
                }
            }, 1000);

            // 4. 定期的なメモリクリア・リフレッシュ (24時間に1回の自動再起動)
            // 描画メモリの肥大化(メモリリーク)を防ぐために深夜にリロードさせるような挙動
            setInterval(() => {
                const h = new Date().getHours();
                // 朝4時〜5時の間でリロードする
                if (h === 4) {
                    console.log("[Watchdog] 定期リフレッシュ(メモリクリア)を実行します。");
                    location.reload();
                }
            }, 1000 * 60 * 60); // 1時間に1回チェック
            
            console.log("[Watchdog] サイネージ無人運用監視モジュールが起動しました。");
        })();
`;

if (!html.includes('initWatchdog')) {
    html = html.replace('</body>', `    <script>\n${watchdogScript}\n    </script>\n</body>`);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_player.html', html, 'utf8');
    console.log('Watchdog attached to signage_player.html!');
} else {
    console.log('Watchdog already attached!');
}
