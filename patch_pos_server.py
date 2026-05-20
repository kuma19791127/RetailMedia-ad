import codecs
import re

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

# Add posTransactions array and to Finance DB
if 'let posTransactions = [];' not in text:
    db_target = "let agencyReferrals = [];"
    if db_target in text:
        text = text.replace(db_target, "let agencyReferrals = [];\nlet posTransactions = [];")
    
    # Update loadFinanceDB
    target_load = "if (data.agencyReferrals) agencyReferrals = data.agencyReferrals;"
    text = text.replace(target_load, target_load + "\n            if (data.posTransactions) posTransactions = data.posTransactions;")
    
    # Update saveFinanceDB
    target_save = "agencyReferrals\n        };"
    text = text.replace(target_save, "agencyReferrals,\n            posTransactions\n        };")

# Add the checkout endpoint
pos_endpoint = """
// ==========================================
// どこでもレジ (モバイルPOS) 連携API
// ==========================================
app.post('/api/pos/checkout', (req, res) => {
    const { companyName, storeName, totalAmount, billingEmail, items } = req.body;
    
    if (!companyName || !totalAmount) {
        return res.status(400).json({ error: "必須データが不足しています" });
    }

    const transactionId = 'pos_' + Date.now() + Math.floor(Math.random()*1000);
    
    setTimeout(saveFinanceDB, 100);
    posTransactions.push({
        id: transactionId,
        companyName,
        storeName: storeName || '未設定',
        totalAmount,
        billingEmail: billingEmail || '',
        items: items || [],
        status: 'completed', // または 'pending_square'
        timestamp: Date.now()
    });

    console.log(`[POS] 売上登録: ${companyName} - ¥${totalAmount}`);
    res.json({ success: true, transactionId });
});

app.get('/api/pos/transactions', (req, res) => {
    res.json(posTransactions);
});
"""

if '/api/pos/checkout' not in text:
    idx = text.rfind("app.listen(")
    if idx != -1:
        text = text[:idx] + pos_endpoint + "\n" + text[idx:]

with codecs.open('server_retail_dist.js', 'w', 'utf-8') as f:
    f.write(text)

print("Patched server_retail_dist.js with POS API")
