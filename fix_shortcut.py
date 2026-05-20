import codecs

with codecs.open('setup_retail_signage.bat', 'r', 'cp932') as f:
    text = f.read()

text = text.replace('oLink.TargetPath = "msedge.exe"', r'oLink.TargetPath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"')

with codecs.open('setup_retail_signage.bat', 'w', 'cp932') as f:
    f.write(text.replace('\r\n', '\n').replace('\n', '\r\n'))

print('Fixed shortcut path.')
