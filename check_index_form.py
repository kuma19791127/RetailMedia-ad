import codecs
import re

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find('id="login-form"')
if idx != -1:
    print(text[idx-200:idx+800])
