import codecs
import re

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

db_logic = """
// ==========================================
// お金・KYC関連データのローカルJSON永続化 (A案)
// ==========================================
const financeDbPath = require('path').join(__dirname, 'finance_database.json');

function loadFinanceDB() {
    try {
        if (require('fs').existsSync(financeDbPath)) {
            const dataStr = require('fs').readFileSync(financeDbPath, 'utf8');
            const data = JSON.parse(dataStr);
            if (data.withdrawalRequests) withdrawalRequests = data.withdrawalRequests;
            if (data.creatorBanks) creatorBanks = data.creatorBanks;
            if (data.kycRequests) kycRequests = data.kycRequests;
            console.log(`[Finance DB] Loaded ${withdrawalRequests.length} withdrawals, ${Object.keys(creatorBanks).length} banks, ${kycRequests.length} KYCs.`);
        }
    } catch (e) {
        console.error("[Finance DB] Load Error", e);
    }
}

function saveFinanceDB() {
    try {
        const data = {
            withdrawalRequests,
            creatorBanks,
            kycRequests
        };
        require('fs').writeFileSync(financeDbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("[Finance DB] Save Error", e);
    }
}

// サーバー起動時に読み込み
loadFinanceDB();
"""

# Insert db_logic right after the variables declaration.
# But withdrawalRequests, creatorBanks, kycRequests are already declared somewhere.
# Let's just find where withdrawalRequests is declared and replace it with this logic.

target = "let withdrawalRequests = [];"
if target in text:
    text = text.replace(target, "let withdrawalRequests = [];\nlet creatorBanks = {};\n// kycRequests is declared elsewhere, let's assume it's global\n" + db_logic)

# Now, we need to add saveFinanceDB() wherever these are modified.
# 1. /api/kyc
kyc_add = "kycRequests.push(newReq);"
text = text.replace(kyc_add, kyc_add + "\n        saveFinanceDB();")

# 2. /api/kyc/:id/status
kyc_status = "kyc.status = status;"
text = text.replace(kyc_status, kyc_status + "\n        saveFinanceDB();")

# 3. /api/creator/bank
bank_save = """app.post('/api/creator/bank', (req, res) => {
    // 既存の実装がどうなってるか不明だが、creatorBanks に保存している想定
"""
# Actually, I don't know where /api/creator/bank is defined. Let me check if it exists.
