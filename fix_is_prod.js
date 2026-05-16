const fs = require('fs');
let code = fs.readFileSync('server_retail_dist.js', 'utf8');

code = code.replace(/let demoBoostMultiplier = 1\.0;\r?\n/, '');
code = code.replace(/let isProductionMode = true;\r?\n/, '');

code = code.replace(/app\.get\('\/api\/ad\/mode', \(req, res\) => \{[\s\S]*?\}\);\r?\n\r?\n?/g, '');
code = code.replace(/app\.get\('\/api\/ad\/demo\/boost', \(req, res\) => \{[\s\S]*?\}\);\r?\n\r?\n?/g, '');

code = code.replace(/scan_count:\s*isProductionMode \? global\.productionStats\.scans : Math\.floor\(1240 \* demoBoostMultiplier\),/g, 'scan_count: global.productionStats.scans,');
code = code.replace(/ab_stats:\s*isProductionMode \? global\.productionStats\.ab : null/g, 'ab_stats: global.productionStats.ab');

code = code.replace(/if \(isProductionMode && playlist\.length > 0 && playlist\[0\]\.id === 'ad_default'\)/g, "if (playlist.length > 0 && playlist[0].id === 'ad_default')");
code = code.replace(/if \(global\.productionStats && isProductionMode\)/g, "if (global.productionStats)");

fs.writeFileSync('server_retail_dist.js', code, 'utf8');
console.log('Removed isProductionMode and demoBoost logic.');
