const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', 'utf8');

// 1. Add manualhelpState variable
if(!doc.includes('let manualhelpState = {')) {
    doc = doc.replace('let manualChat = [];', 'let manualChat = [];\nlet manualhelpState = { manuals: [], logs: [] };');
}

// 2. Add S3 parse logic
const s3ParseTarget = `if (parsed.manualChat && Array.isArray(parsed.manualChat)) {`;
if(doc.includes(s3ParseTarget) && !doc.includes('parsed.manualhelpState')) {
    doc = doc.replace(s3ParseTarget, `if (parsed.manualhelpState) {
            manualhelpState = parsed.manualhelpState;
        }\n        ` + s3ParseTarget);
}

// 3. Add S3 save logic
const s3SaveTarget = `manualChat: typeof manualChat !== 'undefined' ? manualChat : []`;
if(doc.includes(s3SaveTarget) && !doc.includes('manualhelpState: manualhelpState')) {
    doc = doc.replace(s3SaveTarget, s3SaveTarget + `,\n                manualhelpState: typeof manualhelpState !== 'undefined' ? manualhelpState : { manuals: [], logs: [] }`);
}

// 4. Add API endpoints
const manualApi = `
app.get('/api/manualhelp/state', (req, res) => {
    res.json({ success: true, state: manualhelpState });
});
app.post('/api/manualhelp/state', express.json({limit: '10mb'}), (req, res) => {
    try {
        if(req.body.manuals) manualhelpState.manuals = req.body.manuals;
        if(req.body.logs) manualhelpState.logs = req.body.logs;
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ success: false });
    }
});
`;

if(!doc.includes('/api/manualhelp/state')) {
    const apiTarget = `app.get('/api/manualhelp/chat'`;
    if(doc.includes(apiTarget)) {
        doc = doc.replace(apiTarget, manualApi + apiTarget);
    }
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', doc, 'utf8');
console.log('patched manualhelp state on backend');
