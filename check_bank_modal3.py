import codecs

with codecs.open('creator_portal.html', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find('function showBankSettings()')
if idx != -1:
    end_idx = text.find('}', text.find('.then(async (r', idx) + 100)
    print(text[idx:end_idx+300])
