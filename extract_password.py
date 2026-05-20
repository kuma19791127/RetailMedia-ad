import codecs
with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find('type="password"')
if idx != -1:
    print(text[idx-200:idx+200])
