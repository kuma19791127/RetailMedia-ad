const fs = require('fs');
const files = [
    'c:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html'
];
for (const fp of files) {
    let content = fs.readFileSync(fp, 'utf8');
    content = content.replace(/\/\/ Duration validation removed\s*\} catch \(e\) \{/g, '// Duration validation removed\n                } catch (e) {');
    // Also there is one without braces if I messed it up:
    content = content.replace(/\/\/ Duration validation removed\s*\} catch \(e\)\s*console\.warn/g, '// Duration validation removed\n                } catch (e) { console.warn');
    fs.writeFileSync(fp, content);
}
console.log("Fixed missing braces");
