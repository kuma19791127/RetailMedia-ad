const fs = require('fs');
const pathStr = 'C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js';
let t = fs.readFileSync(pathStr, 'utf8');

const targetStr = "globalDashboardStats: typeof globalDashboardStats !== 'undefined' ? globalDashboardStats : {}";
t = t.replace(targetStr, targetStr + ",\n                agencyReferrals: typeof agencyReferrals !== 'undefined' ? agencyReferrals : []");

const parseStr = "if (parsed.globalDashboardStats) globalDashboardStats = parsed.globalDashboardStats;";
t = t.replace(parseStr, parseStr + "\n        if (parsed.agencyReferrals) agencyReferrals = parsed.agencyReferrals;");

fs.writeFileSync(pathStr, t);
console.log("Patched server S3 sync for agency and revenue");
