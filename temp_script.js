

let currentEmail = "";
        let currentPrefix = "RETAILER";

        document.querySelectorAll('input[name="targetStore"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.getElementById('specific-store-id').style.display = e.target.value === 'SPECIFIC' ? 'block' : 'none';
            });
        });

        function switchTab(tabId) {
            document.querySelectorAll('.main-content > div').forEach(div => div.style.display = 'none');
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.getElementById('tab-' + tabId).style.display = 'block';
            event.target.classList.add('active');
        }

        async function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            
            // Temporary simple validation until API is fully wired
            if(email.includes('@') && pass.length > 3) {
                currentEmail = email;
                // Extract retailer prefix from email (e.g. info@life.co.jp -> LIFE)
                const domain = email.split('@')[1];
                if(domain) {
                    currentPrefix = domain.split('.')[0].toUpperCase();
                }
                document.getElementById('retailer-prefix').value = currentPrefix;
                document.getElementById('login-overlay').style.display = 'none';
                loadVideos();
            } else {
                document.getElementById('login-error').style.display = 'block';
            }
        }

        function logout() {
            location.reload();
        }

function generateBatFile() {
    const suffix = document.getElementById('store-suffix').value.trim();
    if(!suffix) {
        Swal.fire("エラー", "店舗番号（または店舗名）を入力してください。", "error");
        return;
    }

    const storeId = `${currentPrefix}_${suffix}`;
    const targetUrl = `https://retail-ad.com/signage_player.html?storeId=${storeId}`;

    const batContent = `@echo off
echo =========================================================
echo Retail Media サイネージ自動起動セットアップ (${storeId})
echo =========================================================
set "TARGET_URL=${targetUrl}"
set "STARTUP_FOLDER=%ALLUSERSPROFILE%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=RetailAd_Signage_${storeId}.lnk"
set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_PATH%" set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

set "VBS_SCRIPT=%temp%\CreateShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") ^> "%VBS_SCRIPT%"
echo sLinkFile = "%STARTUP_FOLDER%\%SHORTCUT_NAME%" ^>^> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) ^>^> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%CHROME_PATH%" ^>^> "%VBS_SCRIPT%"
echo oLink.Arguments = "--kiosk """ ^^^& "%TARGET_URL%" ^^^& """ --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream --no-first-run --no-default-browser-check" ^>^> "%VBS_SCRIPT%"
echo oLink.Save ^>^> "%VBS_SCRIPT%"

cscript /nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%"

echo セットアップが完了しました！
echo 次回起動時から自動的にカメラが許可され、動画がループ再生されます。
timeout /t 3 ^>nul
start "" "%CHROME_PATH%" --kiosk "%TARGET_URL%" --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream --no-first-run
exit /b
`;

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `setup_${storeId}.bat`;
    a.click();
    URL.revokeObjectURL(url);

    Swal.fire("発行完了", `店舗スタッフに「setup_${storeId}.bat」を配布してください。`, "success");
}
            

// Handle File Upload
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#3b82f6'; });
dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = '#94a3b8'; });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#94a3b8';
    if(e.dataTransfer.files.length) handleUpload(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => {
    if(fileInput.files.length) handleUpload(fileInput.files[0]);
});

async function handleUpload(file) {
    document.getElementById('upload-status').style.display = 'block';
    const progress = document.getElementById('upload-progress');
    const text = document.getElementById('upload-text');
    progress.style.width = '30%';
    text.innerText = "圧縮・送信準備中...";

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        progress.style.width = '60%';
        text.innerText = "AWS S3へ送信中...";

        const targetStore = document.querySelector('input[name="targetStore"]:checked').value === 'ALL' ? 'ALL' : document.getElementById('specific-store-id').value;

        try {
            const res = await fetch('/api/retailer/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    fileData: reader.result,
                    prefix: currentPrefix,
                    targetStore: targetStore
                })
            });
            const data = await res.json();
            if(data.success) {
                progress.style.width = '100%';
                text.innerText = "AWS S3への保存完了！配信がスタートしました。";
                text.style.color = "#10b981";
                setTimeout(() => {
                    document.getElementById('upload-status').style.display = 'none';
                    loadVideos();
                    Swal.fire("配信開始", "動画がS3に保存され、5秒以内に全国の指定サイネージと同期されます。", "success");
                }, 2000);
            } else {
                throw new Error(data.error || "Unknown error");
            }
        } catch(e) {
            Swal.fire("エラー", "アップロードに失敗しました: " + e.message, "error");
            document.getElementById('upload-status').style.display = 'none';
        }
    };
}

async function loadVideos() {
    try {
        const res = await fetch('/api/retailer/videos?prefix=' + currentPrefix);
        const videos = await res.json();
        let html = '';
        if(videos.length === 0) {
            html = '<p style="padding:15px; color:#94a3b8;">現在配信中の独自動画はありません。</p>';
        } else {
            videos.forEach(v => {
                html += 
                <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#1e293b;"></strong><br>
                        <span style="font-size:0.85rem; color:#64748b;">配信先: </span>
                    </div>
                    <button onclick="deleteVideo('')" style="color:red; background:none; border:1px solid red; border-radius:5px; padding:5px 10px; cursor:pointer;">配信停止</button>
                </div>;
            });
        }
        document.getElementById('video-list').innerHTML = html;
    } catch(e) {
        console.error(e);
    }
}

async function deleteVideo(id) {
    if(confirm("この動画の配信を停止し、削除しますか？")) {
        await fetch('/api/retailer/videos/' + id, { method: 'DELETE' });
        loadVideos();
    }
}
