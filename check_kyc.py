import codecs
with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()
idx = text.find("app.post('/api/kyc'")
end = text.find("app.post('/api/kyc/:id", idx)
print(text[idx:end])
