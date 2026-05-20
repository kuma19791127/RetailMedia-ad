import codecs
with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()
idx = text.find('id="tab-agencies"')
print(text[idx:idx+1500])
