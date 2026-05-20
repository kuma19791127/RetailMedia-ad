import codecs
import re

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

integration_code = """
// ==========================================
// 外部サービス連携 (GMOあおぞら / freee / 国税庁インボイス)
// ==========================================

// 1. 国税庁 適格請求書発行事業者公表サイトAPI (モック実装・構造設計)
async function verifyInvoiceNumber(tNumber) {
    if (!tNumber || !tNumber.startsWith('T') || tNumber.length !== 14) return false;
    console.log(`[NTA API] 国税庁APIへ照会中... T番号: ${tNumber}`);
    // 実際の連携時は、国税庁APIのアプリケーションIDを付与してGETリクエストを投げる
    // const res = await fetch(`https://invoice-api.nta.go.jp/1/num?id=${NTA_APP_ID}&type=21&history=0&number=${tNumber.substring(1)}`);
    return true; // モック: 正しい形式なら実在するとみなす
}

// 2. freee 会計API (モック実装)
async function createFreeeJournalEntry(amount, withholdingTax, bankFee, creatorName) {
    console.log(`[freee API] 会計freeeに振替伝票を起票します...`);
    // 実際の連携時は OAuth 2.0 アクセストークンを使用して POST /api/1/manual_journals を叩く
    const totalExpense = amount; // 発生した報酬額（経費）
    const actualPayout = amount - withholdingTax - bankFee; // 実際に振り込む額
    
    console.log(`  借方: 支払手数料(報酬) ${totalExpense}円`);
    console.log(`  貸方: 普通預金 ${actualPayout}円`);
    if (withholdingTax > 0) console.log(`  貸方: 預り金(源泉所得税) ${withholdingTax}円`);
    if (bankFee > 0) console.log(`  貸方: 支払手数料(振込手数料) ${bankFee}円`);
    
    return { success: true, journalId: 'freee_' + Date.now() };
}

// 3. GMOあおぞらネット銀行 振込API (モック実装)
async function executeGMOBankTransfer(bankCode, branchCode, accountType, accountNum, holderName, amount) {
    console.log(`[GMO API] GMOあおぞらネット銀行 総合振込API 呼び出し...`);
    // 実際の連携時は クライアントID/シークレット等でアクセストークンを取得し、POST /corporate/v1/transfer/request を叩く
    console.log(`  振込先: 銀行コード:${bankCode} 支店:${branchCode} 口座:${accountNum} 名義:${holderName}`);
    console.log(`  振込金額: ${amount}円`);
    return { success: true, transferId: 'gmo_' + Date.now() };
}

// 出金リクエスト（クリエイターから）
let withdrawalRequests = [];

app.post('/api/creator/withdraw', async (req, res) => {
    const { email, amount } = req.body;
    if (!email || !amount || amount < 5000) {
        return res.status(400).json({ error: "出金は5,000円以上から申請可能です。" });
    }
    
    // クリエイターの銀行情報を取得 (DBモック)
    const bankInfo = creatorBanks[email];
    if (!bankInfo) return res.status(400).json({ error: "銀行口座が登録されていません。" });
    
    // T番号の確認
    if (bankInfo.invoiceNumber) {
        const isValid = await verifyInvoiceNumber(bankInfo.invoiceNumber);
        if (!isValid) return res.status(400).json({ error: "インボイス登録番号が無効です。" });
    }

    // 出金リクエストを登録
    const reqId = 'wd_' + Date.now();
    withdrawalRequests.push({
        id: reqId,
        email: email,
        amount: amount,
        bankInfo: bankInfo,
        status: 'pending',
        requestDate: Date.now()
    });
    console.log(`[Withdraw] 出金申請を受理: ${email} - ¥${amount}`);
    res.json({ success: true, id: reqId });
});

// 支払承認と送金実行（管理者から）
app.post('/api/admin/payout/execute', async (req, res) => {
    const { reqId } = req.body;
    const request = withdrawalRequests.find(r => r.id === reqId && r.status === 'pending');
    if (!request) return res.status(404).json({ error: "無効なリクエストです。" });

    const bank = request.bankInfo;
    const isCorp = bank.businessType === 'corporate';
    
    // 源泉徴収税の計算 (個人のみ、100万円以下は10.21%)
    let withholdingTax = 0;
    if (!isCorp) {
        withholdingTax = Math.floor(request.amount * 0.1021);
    }
    const bankFee = 145; // GMOあおぞらネット銀行から他行宛の場合の振込手数料目安など
    const finalTransferAmount = request.amount - withholdingTax - bankFee;

    try {
        // 1. GMOあおぞらネット銀行で振込実行
        const gmoRes = await executeGMOBankTransfer(bank.bankCode || '0000', bank.branchName, '普通', bank.accountNum, bank.holderName, finalTransferAmount);
        
        // 2. freee 会計へ仕訳登録
        const freeeRes = await createFreeeJournalEntry(request.amount, withholdingTax, bankFee, bank.holderName);
        
        request.status = 'completed';
        request.withholdingTax = withholdingTax;
        request.finalAmount = finalTransferAmount;
        request.processedAt = Date.now();

        res.json({ success: true, message: "送金および会計仕訳が完了しました。", details: { gmo: gmoRes, freee: freeeRes } });
    } catch (e) {
        res.status(500).json({ error: "外部API連携中にエラーが発生しました", details: e.message });
    }
});

// 管理者用 出金リクエスト一覧取得
app.get('/api/admin/payouts', (req, res) => {
    res.json(withdrawalRequests);
});
"""

# Find a good place to inject the integration code, just before app.listen or at the end of routes
idx = text.rfind("app.listen(")
if idx != -1:
    text = text[:idx] + integration_code + "\n" + text[idx:]

# Also update KYC status change to activate monetization
kyc_status_target = """app.post('/api/kyc/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const kyc = kycRequests.find(k => k.id === id);
    if (kyc) {
        kyc.status = status;
        console.log(`[KYC] Status updated for ${id} to ${status}`);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "KYC not found" });
    }
});"""

kyc_status_replace = """app.post('/api/kyc/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const kyc = kycRequests.find(k => k.id === id);
    if (kyc) {
        kyc.status = status;
        
        // --- 収益化アクティベート ---
        // 審査がApproveされた場合、クリエイターを「収益化パートナー」に昇格させる
        if (status === 'approved') {
            console.log(`[Monetization] クリエイター ${kyc.userEmail} の収益化がアクティベートされました！（KYC合格）`);
            // DBモック（実際はDBのUserテーブルのisMonetizedフラグをtrueにする）
        }
        
        console.log(`[KYC] Status updated for ${id} to ${status}`);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "KYC not found" });
    }
});"""

if kyc_status_target in text:
    text = text.replace(kyc_status_target, kyc_status_replace)

with codecs.open('server_retail_dist.js', 'w', 'utf-8') as f:
    f.write(text)

print("Patched server_retail_dist.js with integration APIs")
