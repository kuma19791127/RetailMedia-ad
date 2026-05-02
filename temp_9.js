document.addEventListener('DOMContentLoaded', () => {
            if (typeof budoux !== 'undefined') {
                const parser = budoux.loadDefaultJapaneseParser();
                document.querySelectorAll('h1, h2, h3, p, .subtitle, li').forEach(el => {
                    parser.applyToElement(el);
                });
            }
        });