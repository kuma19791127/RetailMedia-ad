const fs = require('fs');
const target = 'C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js';
let txt = fs.readFileSync(target, 'utf8');

// 1. Add shiftState
if (!txt.includes('let shiftState = {')) {
    txt = txt.replace(`let posTransactions = [];`, `let posTransactions = [];\nlet shiftState = { staff: [], chatHistory: [] };`);
}

// 2. S3 Load
const s3SyncTarget1 = `if (parsed.posTransactions && Array.isArray(parsed.posTransactions)) {`;
if (txt.includes(s3SyncTarget1) && !txt.includes('parsed.shiftState')) {
    txt = txt.replace(s3SyncTarget1, `if (parsed.shiftState && typeof parsed.shiftState === 'object') {
            shiftState = parsed.shiftState;
        }\n        ` + s3SyncTarget1);
}

// 3. S3 Save
const s3SyncTarget2 = `posTransactions: typeof posTransactions !== 'undefined' ? posTransactions : []`;
if (txt.includes(s3SyncTarget2) && !txt.includes('shiftState: shiftState')) {
    txt = txt.replace(s3SyncTarget2, s3SyncTarget2 + `,\n                shiftState: typeof shiftState !== 'undefined' ? shiftState : { staff: [], chatHistory: [] }`);
}

// 4. API Endpoints
const apiTarget = `app.get('/api/admin/sales-history'`;
if (txt.includes(apiTarget) && !txt.includes('/api/shift/state')) {
    const shiftApi = `
app.get('/api/shift/state', (req, res) => {
    res.json({ success: true, state: shiftState });
});
app.post('/api/shift/state', express.json({limit: '10mb'}), (req, res) => {
    try {
        if(req.body.staff) shiftState.staff = req.body.staff;
        if(req.body.chatHistory) shiftState.chatHistory = req.body.chatHistory;
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ success: false });
    }
});
`;
    txt = txt.replace(apiTarget, shiftApi + apiTarget);
}

fs.writeFileSync(target, txt, 'utf8');
console.log('Backend Shift sync patched.');
