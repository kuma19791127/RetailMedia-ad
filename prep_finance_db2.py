import codecs
with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find("app.post('/api/creator/bank'")
if idx != -1:
    end = text.find('});', idx) + 3
    print(text[idx:end])
