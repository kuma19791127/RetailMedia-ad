const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/one/Desktop/RetailMedia_System';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    content = content.replace(/app-icon\.jpg/g, 'app-icon.png');

    if(content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed icon link in: ' + file);
    }
});
