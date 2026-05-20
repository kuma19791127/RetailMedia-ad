import codecs

with codecs.open('store_portal.html', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find('アプリのダウンロードリンクを送信する')
if idx != -1:
    with codecs.open('snippet2.txt', 'w', 'utf-8') as out:
        out.write(text[max(0, idx-400):idx+800])
