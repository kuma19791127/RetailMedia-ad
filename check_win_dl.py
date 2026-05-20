import codecs
import re

with codecs.open('store_portal.html', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find('Win用セキュリティパッチDL')
if idx != -1:
    with codecs.open('win_dl_btn.txt', 'w', 'utf-8') as f:
        f.write(text[max(0, idx-300):idx+300])
