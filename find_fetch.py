import glob
import re
import codecs

files_to_modify = []
for f in glob.glob('*.html'):
    try:
        with codecs.open(f, 'r', 'utf-8') as file:
            content = file.read()
            matches = re.findall(r'fetch\([\n\s]*[\'\`\"]/api/', content)
            if matches:
                files_to_modify.append((f, len(matches)))
    except:
        pass

for f, count in files_to_modify:
    print(f"{f}: {count} raw relative fetch calls")
