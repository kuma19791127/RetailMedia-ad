const fs = require('fs');
const pathStr = 'C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js';
let t = fs.readFileSync(pathStr, 'utf8');

const startIdx = t.indexOf("app.get('/api/creator/stats'");

const unlockApiCode = `
app.get('/api/review/unlock', (req, res) => {
    if(!CREATOR_STATE.unlockRequests) CREATOR_STATE.unlockRequests = [];
    res.json(CREATOR_STATE.unlockRequests);
});

app.post('/api/review/unlock', (req, res) => {
    if(!CREATOR_STATE.unlockRequests) CREATOR_STATE.unlockRequests = [];
    CREATOR_STATE.unlockRequests.push({
        id: Date.now(),
        date: new Date().toISOString(),
        creatorId: req.body.creatorId || 'Creator_Main',
        status: 'pending'
    });
    res.json({ success: true });
});

app.post('/api/review/unlock/:id/approve', (req, res) => {
    if(!CREATOR_STATE.unlockRequests) CREATOR_STATE.unlockRequests = [];
    const item = CREATOR_STATE.unlockRequests.find(r => r.id == req.params.id);
    if(item) {
        item.status = 'approved';
        // Unlock all banned videos for this creator
        if (CREATOR_STATE.videos) {
            CREATOR_STATE.videos.forEach(v => {
                if (v.status === 'ban') {
                    v.status = 'active';
                    v.totalAttention = 0; // Reset metrics
                    v.totalSkip = 0;
                    v.views = 0;
                    v.uplift = 0;
                }
            });
        }
    }
    res.json({ success: true });
});

`;

if (startIdx > -1) {
    t = t.substring(0, startIdx) + unlockApiCode + t.substring(startIdx);
    fs.writeFileSync(pathStr, t);
    console.log("Patched server with unlock APIs 2");
} else {
    console.log("Could not find insertion point");
}
