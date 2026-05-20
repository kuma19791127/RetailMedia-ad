import codecs

with codecs.open('syntax_errors.txt', 'r', 'utf-16le') as f:
    text = f.read()
    
# Remove BOM
if text.startswith('\ufeff'):
    text = text[1:]

with codecs.open('syntax_errors_utf8.txt', 'w', 'utf-8') as f:
    f.write(text)
