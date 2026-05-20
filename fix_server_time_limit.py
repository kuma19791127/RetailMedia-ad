with open('server_retail_dist.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''                    target_store: targetStore || 'ALL'
                };'''
replacement = '''                    target_store: targetStore || 'ALL',
                    time_limit: req.body.time_limit !== undefined ? req.body.time_limit : false
                };'''

text = text.replace(target, replacement)

with open('server_retail_dist.js', 'w', encoding='utf-8') as f:
    f.write(text)
