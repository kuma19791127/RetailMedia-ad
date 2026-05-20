import codecs

for file in ['retailer_portal.html', 'creator_portal.html', 'agency_portal.html', 'ad_dashboard.html', 'anywhere_retail.html', 'anywhere_regi.html']:
    try:
        with codecs.open(file, 'r', 'utf-8') as f:
            text = f.read()

        idx = text.find('type="password"')
        if idx != -1:
            print(f"--- {file} ---")
            print(text[idx-300:idx+200])
    except: pass
