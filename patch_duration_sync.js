const fs = require('fs');

const durationHelper = `
    <script>
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

const durationCheck = `
            // Add 15s check for real users
            if (file.type.startsWith('video/')) {
                try {
                    const duration = await window.getVideoDuration(file);
                    const currentUser = window.currentUser || {};
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
            
            // Check file type`;

function patchDashboard(file) {
    let html = fs.readFileSync(file, 'utf8');
    
    if (!html.includes('getVideoDuration')) {
        html = html.replace('</body>', durationHelper);
    }
    
    const tgt = '// Check file type';
    if (html.includes(tgt) && !html.includes('15秒以内のショート動画')) {
        html = html.replace(tgt, durationCheck);
        fs.writeFileSync(file, html, 'utf8');
        console.log('Patched duration into ' + file);
    }
}

patchDashboard('C:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html');
