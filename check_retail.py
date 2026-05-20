import codecs

with codecs.open('anywhere_retail.html', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find('function fetchSalesData()')
if idx != -1:
    with codecs.open('snippet_retail.txt', 'w', 'utf-8') as out:
        out.write(text[idx-200:idx+2000])
