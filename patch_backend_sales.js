const fs = require('fs');

const target = 'C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js';
let txt = fs.readFileSync(target, 'utf8');

// 1. Add posTransactions variable
if (!txt.includes('let posTransactions = [];')) {
    txt = txt.replace(`let globalSensorLogs = [];`, `let globalSensorLogs = [];\nlet posTransactions = [];`);
}

// 2. S3 sync updates
const s3SyncTarget1 = `if (parsed.users && typeof users !== 'undefined') {
            Object.assign(users, parsed.users);
        }`;
if (txt.includes(s3SyncTarget1) && !txt.includes('parsed.posTransactions')) {
    txt = txt.replace(s3SyncTarget1, s3SyncTarget1 + `\n        if (parsed.posTransactions && Array.isArray(parsed.posTransactions)) {
            posTransactions = parsed.posTransactions;
        }`);
}

const s3SyncTarget2 = `users: typeof users !== 'undefined' ? users : {}`;
if (txt.includes(s3SyncTarget2) && !txt.includes('posTransactions: posTransactions')) {
    txt = txt.replace(s3SyncTarget2, s3SyncTarget2 + `,\n                posTransactions: typeof posTransactions !== 'undefined' ? posTransactions : []`);
}

// 3. `/api/admin/sales` parsing
const salesTarget = `// --- ANYWHERE REGI POS SYNC API ---
app.post('/api/admin/sales', (req, res) => {
    try {
        const txData = req.body;
        console.log(\`[POS Sync] ✅ Received New Transaction: \${txData.transactionId} (\${txData.amount}円)\`);`;

if (txt.includes(salesTarget) && !txt.includes('posTransactions.push(txData)')) {
    txt = txt.replace(salesTarget, salesTarget + `\n        posTransactions.push(txData);`);
}

// 4. Expose `/api/admin/sales-history`
const apiTarget = `app.get('/api/analytics/global', (req, res) => {`;
if (txt.includes(apiTarget) && !txt.includes('/api/admin/sales-history')) {
    txt = txt.replace(apiTarget, `app.get('/api/admin/sales-history', (req, res) => {
    res.json({ success: true, transactions: typeof posTransactions !== 'undefined' ? posTransactions : [] });
});\n\n` + apiTarget);
}

fs.writeFileSync(target, txt, 'utf8');
console.log('Backend POS sync patched.');
