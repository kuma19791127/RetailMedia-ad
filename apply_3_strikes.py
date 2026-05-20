import codecs
import re

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    js = f.read()

strike_tracker = '''// --- STRIKE TRACKING & DEMO LOGIC ---
const accountStrikes = {};
const isDemoAccount = (email) => {
    if (!email) return true;
    return email.includes('demo') || email === 'admin';
};
const unlockRequests = [];

app.get('/api/review/unlock', (req, res) => {
    res.json(unlockRequests);
});
app.post('/api/review/unlock/:id/approve', (req, res) => {
    const id = req.params.id;
    const reqItem = unlockRequests.find(r => r.id === id);
    if (reqItem) {
        reqItem.status = 'approved';
        accountStrikes[reqItem.creatorId] = 0; // Reset strikes
    }
    res.json({ success: true });
});

app.post('/api/creator/request-unlock', (req, res) => {
    const { email, appealText } = req.body;
    unlockRequests.push({
        id: Date.now().toString(),
        creatorId: email,
        appealText: appealText,
        aiRiskScore: 0,
        aiReason: '手動申請',
        status: 'pending',
        date: new Date().toISOString()
    });
    res.json({ success: true });
});
'''

# We need to insert this near the top after app definitions
insert_idx = js.find("app.post('/api/creator/review-content'")
if insert_idx != -1:
    js = js[:insert_idx] + strike_tracker + '\n' + js[insert_idx:]

# Update creator review
old_cr_review = "app.post('/api/creator/review-content', async (req, res) => {\n    const { video_base64, title } = req.body;"
new_cr_review = """app.post('/api/creator/review-content', async (req, res) => {
    const { video_base64, title, email } = req.body;
    
    if (isDemoAccount(email)) {
        return res.json({ safe: false, message: '【デモ制限】デモアカウント（テスト用）では実際の動画アップロード・配信はできません。本番アカウントを登録してください。' });
    }
    
    if (accountStrikes[email] >= 3) {
        return res.json({ safe: false, message: '【アカウント凍結】重大な規約違反を繰り返したため、アカウントが凍結されています。画面下部からロック解除申請を行ってください。', isBanned: true });
    }"""
js = js.replace(old_cr_review, new_cr_review)

old_cr_catch = """if (aiResult.safe === false) {
                    return res.json({ safe: false, message: '【配信停止】AI判定によりポリシー違反が検出されました:\\n' + aiResult.reason });
                } else {"""
new_cr_catch = """if (aiResult.safe === false) {
                    if (email) {
                        accountStrikes[email] = (accountStrikes[email] || 0) + 1;
                    }
                    return res.json({ safe: false, message: `【配信停止】AI判定によりポリシー違反が検出されました:\\n${aiResult.reason}\\n(警告: ${accountStrikes[email] || 1}/3 違反で凍結)` });
                } else {"""
js = js.replace(old_cr_catch, new_cr_catch)

old_cr_catch2 = """if (text.includes('FAIL') || text.includes('"safe": false') || text.includes('"safe":false')) {
                    return res.json({ safe: false, message: '【配信停止】AI判定によりポリシー違反が検出されました:\\n' + text });
                }"""
new_cr_catch2 = """if (text.includes('FAIL') || text.includes('"safe": false') || text.includes('"safe":false')) {
                    if (email) {
                        accountStrikes[email] = (accountStrikes[email] || 0) + 1;
                    }
                    return res.json({ safe: false, message: `【配信停止】AI判定によりポリシー違反が検出されました:\\n${text}\\n(警告: ${accountStrikes[email] || 1}/3 違反で凍結)` });
                }"""
js = js.replace(old_cr_catch2, new_cr_catch2)

# Update ad review
old_ad_review = "app.post('/api/ad/review', async (req, res) => {\n    const { media_base64, product_name } = req.body;"
new_ad_review = """app.post('/api/ad/review', async (req, res) => {
    const { media_base64, product_name, email } = req.body;
    
    if (isDemoAccount(email)) {
        return res.json({ safe: false, message: '【デモ制限】デモアカウント（テスト用）では実際の広告アップロード・配信はできません。本番アカウントを登録してください。' });
    }
    
    if (accountStrikes[email] >= 3) {
        return res.json({ safe: false, message: '【アカウント凍結】重大な規約違反を繰り返したため、広告アカウントが凍結されています。' });
    }"""
js = js.replace(old_ad_review, new_ad_review)

old_ad_catch = """if (aiResult.safe === false) {
                return res.json({ safe: false, message: '【審査却下】AI判定によりポリシー違反が検出されました:\\n' + aiResult.reason });
            } else {"""
new_ad_catch = """if (aiResult.safe === false) {
                if (email) {
                    accountStrikes[email] = (accountStrikes[email] || 0) + 1;
                }
                return res.json({ safe: false, message: `【審査却下】AI判定によりポリシー違反が検出されました:\\n${aiResult.reason}\\n(警告: ${accountStrikes[email] || 1}/3 違反で凍結)` });
            } else {"""
js = js.replace(old_ad_catch, new_ad_catch)

old_kyc_passed = """creatorBankData[email] = { email, bankName, branchName, accountNum, holderName, updatedAt: new Date().toISOString() };
        console.log(`[Creator] Bank Info Updated & KYC Passed for: ${email}`);
        res.json({ success: true, message: "本人確認（KYC）を通過し、口座情報を保存しました" });"""
new_kyc_passed = """creatorBankData[email] = { email, bankName, branchName, accountNum, holderName, updatedAt: new Date().toISOString() };
        
        // Push to KYC requests so Admin can view the ID in review.html
        kycRequests.push({
            id: 'CR_KYC_' + Date.now(),
            userEmail: email,
            corpId: holderName + ' (クリエイター名義)',
            duns: 'AI名義一致検証: パス (' + aiResult.detected_name + ')',
            status: 'pending',
            createdAt: new Date().toISOString(),
            proofUrl: idBase64
        });
        
        console.log(`[Creator] Bank Info Updated & KYC Passed for: ${email}`);
        res.json({ success: true, message: "本人確認（KYC）を通過し、口座情報を保存しました" });"""
js = js.replace(old_kyc_passed, new_kyc_passed)

with codecs.open('server_retail_dist.js', 'w', 'utf-8') as f:
    f.write(js)
print("Server logic successfully updated!")

with codecs.open('creator_portal.html', 'r', 'utf-8') as f:
    cp = f.read()

old_cp_fetch = "body: JSON.stringify({ video_base64: fileUrl || \"mock_data\", title: title })"
new_cp_fetch = "body: JSON.stringify({ video_base64: fileUrl || \"mock_data\", title: title, email: sessionStorage.getItem('retailUserEmail') || sessionStorage.getItem('retailMediaAuth') })"
cp = cp.replace(old_cp_fetch, new_cp_fetch)

# Add unlock request UI logic
cp_unlock = """
                        if (!reviewData.safe) {
                            if (reviewData.isBanned) {
                                Swal.fire({
                                    title: '❌ アカウント凍結',
                                    html: '<div style="color:red;font-size:0.9rem;text-align:left;">' + reviewData.message + '</div><br><button id="btn-unlock-req" class="btn btn-primary" style="margin-top:10px;">ロック解除を申請する</button>',
                                    icon: 'error',
                                    showConfirmButton: false,
                                    didOpen: () => {
                                        document.getElementById('btn-unlock-req').onclick = async () => {
                                            const { value: text } = await Swal.fire({
                                                title: '申し開き（理由）',
                                                input: 'textarea',
                                                inputPlaceholder: '規約に違反していない理由をご記入ください...'
                                            });
                                            if (text) {
                                                await fetch(API_BASE + '/api/creator/request-unlock', {
                                                    method: 'POST',
                                                    headers: {'Content-Type':'application/json'},
                                                    body: JSON.stringify({ email: sessionStorage.getItem('retailUserEmail') || sessionStorage.getItem('retailMediaAuth'), appealText: text })
                                                });
                                                Swal.fire('送信完了', '管理者に解除申請を送信しました。', 'success');
                                            }
                                        }
                                    }
                                });
                                return;
                            }
                            Swal.fire({
                                title: '❌ 審査不合格',
                                html: '<div style="color:red;font-size:0.9rem;text-align:left;">' + reviewData.message + '</div>',
                                icon: 'error'
                            });
                            return;
                        }"""
cp = re.sub(r'if \(!reviewData\.safe\) \{[\s\S]*?return;\s*\}', cp_unlock, cp)

with codecs.open('creator_portal.html', 'w', 'utf-8') as f:
    f.write(cp)
print("creator_portal updated!")

with codecs.open('advertiser_dashboard.html', 'r', 'utf-8') as f:
    ad = f.read()

old_ad_fetch = "body: JSON.stringify({ media_base64: fileUrl || \"mock_data\", product_name: title })"
new_ad_fetch = "body: JSON.stringify({ media_base64: fileUrl || \"mock_data\", product_name: title, email: sessionStorage.getItem('retailUserEmail') || sessionStorage.getItem('retailMediaAuth') })"
ad = ad.replace(old_ad_fetch, new_ad_fetch)

with codecs.open('advertiser_dashboard.html', 'w', 'utf-8') as f:
    f.write(ad)
print("advertiser_dashboard updated!")
