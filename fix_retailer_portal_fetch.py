with open('retailer_portal.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = 'body: JSON.stringify({ filename: file.name, fileData: reader.result, prefix: currentPrefix })'
replacement = '''const enableTimeLimit = document.getElementById('enable-time-limit') ? document.getElementById('enable-time-limit').checked : false;
                        const reqBody = { 
                            filename: file.name, 
                            fileData: reader.result, 
                            prefix: currentPrefix,
                            time_limit: enableTimeLimit
                        };
                        body: JSON.stringify(reqBody)'''

text = text.replace(target, replacement)

with open('retailer_portal.html', 'w', encoding='utf-8') as f:
    f.write(text)
