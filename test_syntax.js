const fs = require('fs');
const html = fs.readFileSync('retailer_portal.html', 'utf8');
const scriptMatches = html.matchAll(/<script>([\s\S]*?)<\/script>/g);
let i = 1;
for (const match of scriptMatches) {
    fs.writeFileSync(`temp_script_${i}.js`, match[1], 'utf8');
    const { execSync } = require('child_process');
    try {
        execSync(`node -c temp_script_${i}.js`);
        console.log(`Script ${i} Syntax is OK`);
    } catch (e) {
        console.log(`Script ${i} Syntax Error: ` + e.message);
    }
    i++;
}
