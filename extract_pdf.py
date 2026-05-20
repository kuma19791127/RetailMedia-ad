import codecs
with codecs.open('manualhelp.html', 'r', 'utf-8') as f:
    text = f.read()

idx1 = text.find('function handlePdfUpload(event)')
if idx1 != -1:
    print('=== handlePdfUpload ===')
    end = text.find('function', idx1 + 10)
    print(text[idx1:end].encode('cp932', errors='replace').decode('cp932'))

idx2 = text.find('function handleAiPdf(e)')
if idx2 != -1:
    print('=== handleAiPdf ===')
    end = text.find('function', idx2 + 10)
    print(text[idx2:end].encode('cp932', errors='replace').decode('cp932'))
