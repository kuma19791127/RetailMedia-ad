import codecs

with codecs.open('manualhelp.html', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find('id="pdf-upload"')
if idx != -1:
    print(text[max(0, idx-100):idx+500])
