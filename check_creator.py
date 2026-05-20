import codecs

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find("app.post('/api/creator/upload'")
if idx != -1:
    end_idx = text.find('});', idx)
    print(text[idx:end_idx+3])
