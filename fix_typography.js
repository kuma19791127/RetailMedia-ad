const fs = require('fs');
const typoBlock = \
    <!-- ULTIMATE JAPANESE TYPOGRAPHY FIX -->
    <script src=\"https://unpkg.com/budoux/bundle/budoux-ja.min.js\"></script>
    <style>
        h1, h2, h3, h4, h5 {
            text-wrap: balance !important;
            word-break: keep-all !important;
            overflow-wrap: break-word !important;
        }
        p, .subtitle, li, .card p {
            word-break: keep-all !important;
            overflow-wrap: break-word !important;
        }
        @media (max-width: 768px) {
            .desktop-br { display: none !important; }
            h1 { font-size: clamp(1.8rem, 6vw, 2.5rem) !important; line-height: 1.3 !important; }
            h2 { font-size: clamp(1.4rem, 5vw, 2rem) !important; line-height: 1.4 !important; }
        }
    </style>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof budoux !== 'undefined') {
                const parser = budoux.loadDefaultJapaneseParser();
                document.querySelectorAll('h1, h2, h3, p, .subtitle, li').forEach(el => {
                    parser.applyToElement(el);
                });
            }
        });
    </script>
    <!-- END TYPOGRAPHY FIX -->
\;

let files = fs.readdirSync('.');
files.forEach(f => {
    if(f.endsWith('.html')) {
        let content = fs.readFileSync(f, 'utf8');
        if(content.includes('ULTIMATE JAPANESE TYPOGRAPHY FIX')) {
            content = content.replace(/<!-- ULTIMATE JAPANESE TYPOGRAPHY FIX -->[\s\S]*?<!-- END TYPOGRAPHY FIX -->/, typoBlock);
            fs.writeFileSync(f, content, 'utf8');
            console.log('Updated ' + f);
        } else if(content.includes('</head>')) {
            content = content.replace('</head>', typoBlock + '\n</head>');
            fs.writeFileSync(f, content, 'utf8');
            console.log('Injected into ' + f);
        }
    }
});
