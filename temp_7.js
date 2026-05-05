document.addEventListener('DOMContentLoaded', () => {
            if (typeof budoux !== 'undefined') {
                const parser = budoux.loadDefaultJapaneseParser();
                // Apply to standard text elements avoiding breaking components
                const elements = document.querySelectorAll('h1, h2, h3, p, .card p, .subtitle');
                elements.forEach(el => {
                    parser.applyToElement(el);
                });
            }
        });