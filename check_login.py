import codecs

with codecs.open('anywhere_regi.html', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find('id="input-pass"')
if idx != -1:
    print(text[max(0, idx-300):min(len(text), idx+300)])
