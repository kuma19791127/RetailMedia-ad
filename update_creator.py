import codecs

with codecs.open('signage_server.js', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace("id: 'creator_' + Date.now() + Math.random(),", "id: 'retailer_' + Date.now() + Math.random(),")
text = text.replace("title: `Creator: ${file}`", "title: `Retailer: ${file}`")

with codecs.open('signage_server.js', 'w', 'utf-8') as f:
    f.write(text)

print('signage_server.js updated')
