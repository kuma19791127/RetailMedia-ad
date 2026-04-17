const fs = require('fs');
let serverSrc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', 'utf8');

if (!serverSrc.includes('let manualChat = [];')) {
    serverSrc = serverSrc.replace(`let shiftState = {`, `let manualChat = [];\nlet shiftState = {`);
}

const syncParseTarget = `if (parsed.shiftState && typeof parsed.shiftState === 'object') {`;
if (serverSrc.includes(syncParseTarget) && !serverSrc.includes('parsed.manualChat')) {
    serverSrc = serverSrc.replace(syncParseTarget, `if (parsed.manualChat && Array.isArray(parsed.manualChat)) {
            manualChat = parsed.manualChat;
        }\n        ` + syncParseTarget);
}

const syncSaveTarget = `shiftState: typeof shiftState !== 'undefined' ? shiftState : { staff: [], chatHistory: [] }`;
if (serverSrc.includes(syncSaveTarget) && !serverSrc.includes('manualChat: manualChat')) {
    serverSrc = serverSrc.replace(syncSaveTarget, syncSaveTarget + `,\n                manualChat: typeof manualChat !== 'undefined' ? manualChat : []`);
}

const manualChatApi = `
// ManualHelp Chat API
app.get('/api/manualhelp/chat', (req, res) => {
    res.json({ success: true, chat: manualChat });
});
app.post('/api/manualhelp/chat', express.json({limit: '10mb'}), (req, res) => {
    try {
        if(Array.isArray(req.body.chat)) {
            manualChat = req.body.chat;
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, error: "Invalid data form" });
        }
    } catch(e) {
        res.status(500).json({ success: false });
    }
});
`;

if (!serverSrc.includes('/api/manualhelp/chat')) {
    const apiHookTarget = `app.get('/api/shift/state'`;
    if(serverSrc.includes(apiHookTarget)) {
        serverSrc = serverSrc.replace(apiHookTarget, manualChatApi + apiHookTarget);
    }
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', serverSrc, 'utf8');
console.log("Patched server for manualhelp chat.");
