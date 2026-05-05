const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/one/Desktop/RetailMedia_System';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const setupCode = `
    <!-- PWA Setup -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#2563eb">
    <link rel="apple-touch-icon" href="/app-icon.jpg">
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/service-worker.js');
        });
      }
    </script>
</head>`;

files.forEach(file => {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    if (!content.includes('manifest.json')) {
        content = content.replace(/<\/head>/i, setupCode);
    }

    if(content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('PWA Setup injected: ' + file);
    }
});
