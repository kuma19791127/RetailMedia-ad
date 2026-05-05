const fs = require('fs');

const pAdmin = 'C:/Users/one/Desktop/RetailMedia_System/admin_portal.html';
let tAdmin = fs.readFileSync(pAdmin, 'utf8');

// Remove retailMediaAuth script block
tAdmin = tAdmin.replace(
    /\/\/ Check if the user has a valid session token[\s\S]*?window\.location\.replace\('index\.html'\);\s*\}/,
    '// Admin login is independent; Removed redirect restriction.'
);

// Update table header
tAdmin = tAdmin.replace(
    '<th>広告主 (Advertiser)</th>',
    '<th>広告主 (Advertiser)<br><span style="font-size:10px;">担当者 / 電話番号</span></th>'
);

// Update rendering logic
tAdmin = tAdmin.replace(
    '<td>${r.advertise}</td>',
    '<td>${r.advertise}<br><span style="font-size:11px;color:#7f8c8d;">${r.advContact || \'未登録\'} / ${r.advPhone || \'未登録\'}</span></td>'
);

fs.writeFileSync(pAdmin, tAdmin);

const pServer = 'C:/Users/one/Desktop/RetailMedia_System/server.js';
let tServer = fs.readFileSync(pServer, 'utf8');

// Inject agency API handlers into server.js
const agencyCode = `
// ==== Agency Portal Endpoints ====
let agencyReferrals = [];

app.get('/api/admin/agency', (req, res) => {
    res.json(agencyReferrals);
});

app.post('/api/admin/agency-submit', (req, res) => {
    const data = req.body;
    data.id = 'ag_' + Date.now();
    data.status = 'Pending';
    agencyReferrals.push(data);
    res.json({ success: true, item: data });
});
// =================================
`;

if (!tServer.includes('/api/admin/agency-submit')) {
    // Append before the start server line or near other endpoints
    tServer = tServer.replace(
        "app.listen(PORT",
        agencyCode + "\n\napp.listen(PORT"
    );
    fs.writeFileSync(pServer, tServer);
}

console.log("admin_portal.html and server.js updated successfully.");
