import codecs

with codecs.open('manualhelp.html', 'r', 'utf-8') as f:
    text = f.read()
    
idx = text.find('function handlePdfUpload')
if idx != -1:
    with codecs.open('pdf_upload_code.txt', 'w', 'utf-8') as f:
        f.write(text[idx:idx+1500])
