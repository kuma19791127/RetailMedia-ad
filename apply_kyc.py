import codecs

# 1. Update creator_portal.html
with codecs.open('creator_portal.html', 'r', 'utf-8') as f:
    html = f.read()

old_html = """                        <label style="display:block; margin-bottom:5px; color:#555;">口座名義 (カタカナ)</label>
                        <input type="text" id="bank-holder" class="swal2-input" placeholder="例: ヤマダ タロウ" style="width:80%; margin:0 0 15px 0;">
                        
                        <p style="font-size:0.8rem; color:#888;">※登録した口座に、月末締めの翌月末払いで広告収益が自動で振り込まれます。</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '保存する',
                cancelButtonText: 'キャンセル',
                preConfirm: () => {
                    return {
                        bankName: document.getElementById('bank-name').value,
                        branchName: document.getElementById('bank-branch').value,
                        accountNum: document.getElementById('bank-account').value,
                        holderName: document.getElementById('bank-holder').value,
                        email: document.getElementById('bank-email').value
                    }
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const data = result.value;
                    fetch(`${API_BASE}/api/creator/bank`, {"""

new_html = """                        <label style="display:block; margin-bottom:5px; color:#555;">口座名義 (カタカナ)</label>
                        <input type="text" id="bank-holder" class="swal2-input" placeholder="例: ヤマダ タロウ" style="width:80%; margin:0 0 15px 0;">
                        
                        <hr style="margin: 15px 0; border: 0.5px solid #eee;">
                        <label style="display:block; margin-bottom:5px; color:#c0392b; font-weight:bold;">本人確認書類 (必須)</label>
                        <p style="font-size:0.75rem; color:#888; margin-top:0;">運転免許証やマイナンバーカード等（※口座名義と一致しない場合はAIにより登録拒否されます）</p>
                        <input type="file" id="bank-id-image" accept="image/*" style="width:80%; margin:0 0 15px 0; padding:10px; border:1px solid #ccc; border-radius:5px;">
                        
                        <p style="font-size:0.8rem; color:#888;">※登録した口座に、月末締めの翌月末払いで広告収益が自動で振り込まれます。</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '保存する',
                cancelButtonText: 'キャンセル',
                preConfirm: async () => {
                    const fileInput = document.getElementById('bank-id-image');
                    const holderName = document.getElementById('bank-holder').value;
                    if (!holderName) {
                        Swal.showValidationMessage('口座名義を入力してください');
                        return false;
                    }
                    if (fileInput.files.length === 0) {
                        Swal.showValidationMessage('本人確認書類の画像を選択してください');
                        return false;
                    }
                    try {
                        const idBase64 = await fileToBase64(fileInput.files[0]);
                        return {
                            bankName: document.getElementById('bank-name').value,
                            branchName: document.getElementById('bank-branch').value,
                            accountNum: document.getElementById('bank-account').value,
                            holderName: holderName,
                            email: document.getElementById('bank-email').value,
                            idBase64: idBase64
                        }
                    } catch(e) {
                        Swal.showValidationMessage('画像の読み込みに失敗しました');
                        return false;
                    }
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: '🤖 KYC（本人確認）審査中...',
                        html: 'AIが身分証と口座名義の一致を確認しています...<br><span style="font-size:0.8rem;color:#888">少々お待ちください</span>',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading()
                    });
                    const data = result.value;
                    fetch(`${API_BASE}/api/creator/bank`, {"""

if old_html in html:
    html = html.replace(old_html, new_html)
    with codecs.open('creator_portal.html', 'w', 'utf-8') as f:
        f.write(html)
    print("creator_portal.html updated")
else:
    print("Could not find html block in creator_portal")

# 2. Update server_retail_dist.js
with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    js = f.read()

old_js = """app.post('/api/creator/bank', (req, res) => {
    const { email, bankName, branchName, accountNum, holderName } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    // Using email as primary key
    creatorBankData[email] = { email, bankName, branchName, accountNum, holderName, updatedAt: new Date().toISOString() };
    console.log(`[Creator] Bank Info Updated for: ${email}`);
    res.json({ success: true });
});"""

new_js = """app.post('/api/creator/bank', async (req, res) => {
    const { email, bankName, branchName, accountNum, holderName, idBase64 } = req.body;
    if (!email || !holderName) return res.status(400).json({ error: "必要な情報が不足しています" });
    if (!idBase64) return res.status(400).json({ error: "身分証画像が必要です" });

    try {
        let mimeType = 'image/jpeg';
        let base64Data = idBase64;
        const match = idBase64.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
            mimeType = match[1];
            base64Data = match[2];
        }

        if (typeof generativeModel !== 'undefined') {
            const promptText = `あなたは厳密なKYC（本人確認）AIです。
以下の身分証画像を読み取り、書かれている「氏名（本名）」を抽出してください。
その後、申請者が入力した口座名義（カタカナ）「${holderName}」と同一人物であるか厳密に判定してください。
もし氏名の読みと口座名義が一致していれば match: true、偽名や別人の口座（法人口座含む）であれば match: false としてください。
必ず以下のJSON形式のみを出力してください。
{"match": true, "detected_name": "山田 太郎", "reason": "読みが一致するため"}`;
            
            const request = {
                contents: [{
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: mimeType, data: base64Data } },
                        { text: promptText }
                    ]
                }]
            };
            const result = await generativeModel.generateContent(request);
            const response = await result.response;
            const text = response.candidates[0].content.parts[0].text;
            
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiResult = JSON.parse(cleanJson);
            
            if (aiResult.match !== true) {
                console.log(`[Creator KYC Blocked] ${email} - ID: ${aiResult.detected_name} != Bank: ${holderName}`);
                return res.status(400).json({ error: `【AI判定エラー】身分証の氏名（${aiResult.detected_name || '不明'}）と口座名義（${holderName}）が一致しませんでした。詐欺防止のため登録を拒否しました。` });
            }
        }
        
        creatorBankData[email] = { email, bankName, branchName, accountNum, holderName, updatedAt: new Date().toISOString() };
        console.log(`[Creator] Bank Info Updated & KYC Passed for: ${email}`);
        res.json({ success: true, message: "本人確認（KYC）を通過し、口座情報を保存しました" });
    } catch (e) {
        console.error("KYC Error:", e);
        res.status(500).json({ error: "本人確認システムの処理に失敗しました。画像が不鮮明な可能性があります。" });
    }
});"""

if old_js in js:
    js = js.replace(old_js, new_js)
    with codecs.open('server_retail_dist.js', 'w', 'utf-8') as f:
        f.write(js)
    print("server_retail_dist.js updated")
else:
    print("Could not find js block")
