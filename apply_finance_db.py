import codecs

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

target = "let withdrawalRequests = [];"
if target in text:
    if "let creatorBanks = {};" not in text:
        text = text.replace(target, "let withdrawalRequests = [];\nlet creatorBanks = {};\n" + db_logic)
    else:
        text = text.replace(target, "let withdrawalRequests = [];\n" + db_logic)


# Add saveFinanceDB() wherever data is modified
def inject_save(text, search_str, inject_str):
    if search_str in text and inject_str not in text:
        return text.replace(search_str, search_str + "\n        " + inject_str)
    return text

text = inject_save(text, "kycRequests.push(newReq);", "saveFinanceDB();")
text = inject_save(text, "kyc.status = status;", "saveFinanceDB();")
text = inject_save(text, "withdrawalRequests.push({", "setTimeout(saveFinanceDB, 100);\n    withdrawalRequests.push({")
text = inject_save(text, "request.processedAt = Date.now();", "saveFinanceDB();")
text = inject_save(text, "creatorBanks[email] = {", "setTimeout(saveFinanceDB, 100);\n    creatorBanks[email] = {")
text = inject_save(text, "creatorBanks[req.body.email] = req.body;", "saveFinanceDB();")


with codecs.open('server_retail_dist.js', 'w', 'utf-8') as f:
    f.write(text)

print("Patched server_retail_dist.js with DB logic")
