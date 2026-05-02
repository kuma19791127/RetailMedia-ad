import os

filepath = 'c:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

static_code = """// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));"""

new_static_code = """// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/desktop_shorts', express.static(path.join(require('os').homedir(), 'Desktop', '広告ショート')));"""

if static_code in content:
    content = content.replace(static_code, new_static_code)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Static route added')
else:
    print('Could not find static_code block')
