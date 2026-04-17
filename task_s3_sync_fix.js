const fs = require('fs');
const path = require('path');

const target = 'C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js';
let txt = fs.readFileSync(target, 'utf8');

// Update parsing
const parseTarget = `        if (parsed.globalDashboardStats && typeof globalDashboardStats !== 'undefined') {
            Object.assign(globalDashboardStats, parsed.globalDashboardStats);
        }`;
const parseRepl = parseTarget + `
        if (parsed.productionStats) {
            global.productionStats = parsed.productionStats;
        }
        if (parsed.creatorStats && typeof creatorStats !== 'undefined') {
            Object.assign(creatorStats, parsed.creatorStats);
        }
        if (parsed.globalSensorLogs && typeof globalSensorLogs !== 'undefined') {
            globalSensorLogs.length = 0;
            parsed.globalSensorLogs.forEach(l => globalSensorLogs.push(l));
        }`;

// Update stringifier
const strTarget = `                agencyReferrals: typeof agencyReferrals !== 'undefined' ? agencyReferrals : []`;
const strRepl = strTarget + `,
                productionStats: global.productionStats ? global.productionStats : null,
                creatorStats: typeof creatorStats !== 'undefined' ? creatorStats : {},
                globalSensorLogs: typeof globalSensorLogs !== 'undefined' ? globalSensorLogs : []`;

if (txt.includes(parseTarget) && !txt.includes('parsed.productionStats')) {
    txt = txt.replace(parseTarget, parseRepl);
    txt = txt.replace(strTarget, strRepl);
    fs.writeFileSync(target, txt, 'utf8');
    console.log('Successfully patched server_retail_dist.js for correct S3 missing stats sync');
} else {
    console.log('Target not found or already patched.');
}
