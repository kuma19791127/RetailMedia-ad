import codecs

files = ['anywhere_regi.html', 'anywhere_retail.html', 'shift_manager.html', 'manualhelp.html', 'login_portal.html', 'index.html', 'ai_voice_studio.html', 'retailer_portal.html']
for f in files:
    try:
        with codecs.open(f, 'r', 'utf-8') as file:
            content = file.read()
            idx = content.find('type="password"')
            if idx != -1:
                start = content.rfind('<form', 0, idx)
                end = content.find('</form>', idx)
                if start != -1 and end != -1:
                    print(f'=== {f} ===')
                    print(content[start:end+7].encode('cp932', errors='replace').decode('cp932'))
    except Exception as e:
        pass
