const fs = require('fs');
let doc = fs.readFileSync('ad_dashboard.html', 'utf8');

doc = doc.replace(/'\/api\/creator\/review-content'/g, "API_URL + '/api/creator/review-content'");
doc = doc.replace(/'\/api\/review\/unlock'/g, "API_URL + '/api/review/unlock'");
doc = doc.replace(/'\/api\/ad\/upload'/g, "API_URL + '/api/ad/upload'");
doc = doc.replace(/'\/api\/ad\/analytics'/g, "API_URL + '/api/ad/analytics'");
doc = doc.replace(/\`\/api\/ad\/demo\/boost\$\{params\}\`/g, "\`\${API_URL}/api/ad/demo/boost\${params}\`");

fs.writeFileSync('ad_dashboard.html', doc, 'utf8');
console.log('Fixed ad_dashboard missing API_URLs');
