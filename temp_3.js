
        let currentEmail = "demo";
        let currentPrefix = "demo";

        function addStoreInput() {
            const container = document.getElementById('specific-store-container');
            const row = document.createElement('div');
            row.className = 'store-input-row';
            row.style.cssText = 'display:flex; gap:5px; margin-bottom:5px;';
            row.innerHTML = `<input type="text" class="specific-store-id" placeholder="例: LIFE_002" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;">
                             <button onclick="this.parentElement.remove()" style="background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer;">❌ 削除</button>`;
            container.appendChild(row);
        }

        function generateSetupInstructions() {
            const suffix = document.getElementById('store-suffix').value.trim();
            if(!suffix) { Swal.fire("エラー", "店舗番号（または店舗名）を入力してください。", "error"); return; }
            
            const storeId = `${currentPrefix}_${suffix}`;
            const text = `【サイネージ初期設定のお願い】\n\n店舗のAndroidサイネージ端末（またはタブレット）にて、以下の設定をお願いします。\n\n1. Google Playストアより「Anywhere Retail (Signage)」アプリをインストールしてください。\n2. アプリの初回起動時に、以下のIDを入力してログインしてください。\n\n■ 企業ID: ${currentPrefix}\n■ 店舗ID: ${suffix}\n\n※設定完了後、数秒で自動的に広告・CMの放映がスタートします。電源を入れるだけで次回からは自動再生されます。`;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    Swal.fire("コピー完了", "クリップボードに案内文をコピーしました。店舗スタッフにメール等で送信してください。", "success");
                }).catch(err => {
                    Swal.fire("エラー", "コピーに失敗しました。手動でコピーしてください。", "error");
                });
            } else {
                prompt("以下のテキストをコピーして共有してください:", text);
            }
        }

        function switchTab(tabId) {
            document.querySelectorAll('.main-content > div').forEach(div => div.style.display = 'none');
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.getElementById('tab-' + tabId).style.display = 'block';
            event.target.classList.add('active');
        }

        async function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            currentEmail = email;
            currentPrefix = email.split('@')[0];
            document.getElementById('retailer-prefix').value = currentPrefix;
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('inline-2fa-section').style.display = 'block';
        }

        function submitInline2FAVerify() {
            document.getElementById('login-overlay').style.display = 'none';
            loadVideos();
        }

        function logout() { location.reload(); }

        function openProfileModal(showName = false) {
            document.getElementById('prof-org').value = localStorage.getItem('retailer_org') || "Demo Store";
            document.getElementById('prof-email').value = localStorage.getItem('retailer_email') || currentPrefix;
            document.getElementById('modal-profile').style.display = 'flex';
        }

        async function saveProfile() {
            const org = document.getElementById('prof-org').value;
            const email = document.getElementById('prof-email').value;
            localStorage.setItem('retailer_org', org);
            localStorage.setItem('retailer_email', email);
            currentPrefix = email.split('@')[0];
            document.getElementById('retailer-prefix').value = currentPrefix;
            document.getElementById('modal-profile').style.display = 'none';
            Swal.fire({toast:true, position:'top-end', icon:'success', title:'保存しました', showConfirmButton:false, timer:3000});
        }

        async function handleUpload(file) {
            document.getElementById('upload-status').style.display = 'block';
            const progress = document.getElementById('upload-progress');
            const text = document.getElementById('upload-text');
            progress.style.width = '60%';
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const res = await fetch('/api/retailer/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: file.name, fileData: reader.result, prefix: currentPrefix })
                    });
                    const data = await res.json();
                    if(data.success) {
                        progress.style.width = '100%';
                        setTimeout(() => {
                            document.getElementById('upload-status').style.display = 'none';
                            loadVideos();
                            Swal.fire("成功", "S3へ保存完了しました。", "success");
                        }, 2000);
                    }
                } catch(e) {
                    Swal.fire("エラー", "アップロード失敗", "error");
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
                html += `
                <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#1e293b;">${v.title}</strong><br>
                        <span style="font-size:0.85rem; color:#64748b;">配信先: ${v.target_store === 'ALL' ? '全店舗' : v.target_store}</span>
                    </div>
                    <button onclick="deleteVideo('${v.id}')" style="color:red; background:none; border:1px solid red; border-radius:5px; padding:5px 10px; cursor:pointer;">配信停止</button>
                </div>`;
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

function showAdPolicy() {
    Swal.fire({
        title: '配信・広告審査基準 (AI Moderation)',
        html: `<div style="text-align:left; font-size:0.95rem; line-height:1.6; color:#475569;">
            以下のコンテンツが含まれている場合、AIによって自動的に拒絶・アカウント停止となる可能性があります。
            <ul style="margin-top:10px; padding-left:20px;">
                <li style="margin-bottom:8px;"><b>公序良俗違反:</b> 過度な暴力、性的描写、ヘイトスピーチ等に反する内容。</li>
                <li style="margin-bottom:8px;"><b>誇大広告・詐欺:</b> 「必ず儲かる」「投資で稼ぐ」といった投資詐欺や、科学的根拠のない効果効能の標榜（薬機法違反）。</li>
                <li style="margin-bottom:8px;"><b>スパム・悪質誘導:</b> 「続きはLINEで」「LINE登録はこちら」など、外部SNSへ誘導して情報商材を売るようなスパム・詐欺的誘導。</li>
            </ul>
        </div>`,
        icon: 'info',
        confirmButtonText: '確認しました',
        confirmButtonColor: '#3b82f6'
    });
}
