with open('retailer_portal.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = 'https://retail-ad.com/download/RetailMediaSignage.apk'
replacement = 'https://retail-media-db-2026.s3.us-east-1.amazonaws.com/app-debug.apk'
text = text.replace(target, replacement)

with open('retailer_portal.html', 'w', encoding='utf-8') as f:
    f.write(text)

with open('store_portal.html', 'r', encoding='utf-8') as f:
    text2 = f.read()

text2 = text2.replace(target, replacement)

with open('store_portal.html', 'w', encoding='utf-8') as f:
    f.write(text2)
