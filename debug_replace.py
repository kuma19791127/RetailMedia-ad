import io
with io.open('anywhere_lp.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    '        body {\n            font-family: \'Noto Sans JP\', sans-serif;\n            background-color: var(--light);\n            color: #333;\n            line-height: 1.6;\n        }',
    '''        body {
            font-family: 'Noto Sans JP', sans-serif;
            background-color: var(--light);
            color: #333;
            line-height: 1.6;
            overflow-x: hidden;
            word-wrap: break-word; /* Safe fallback */
        }'''
)
