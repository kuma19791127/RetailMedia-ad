import codecs
import re

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

for match in re.finditer(r"app\.post\('/api/(?:ad|creator)/upload',", text):
    start = match.start()
    end = text.find('});', start)
    if end != -1:
        print(text[start:end+3].encode('utf-8').decode('utf-8'))
        print('---')
