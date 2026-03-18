const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/one/Desktop/RetailMedia_System';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const adsenseCode = `
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9174386245513478" crossorigin="anonymous"></script>
</head>`;

files.forEach(file => {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    // 既に挿入されていないかチェック
    if (!content.includes('ca-pub-9174386245513478')) {
        content = content.replace(/<\/head>/i, adsenseCode);
    }

    if(content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('AdSense Added to: ' + file);
    }
});
console.log('AdSense script injection completed!');
