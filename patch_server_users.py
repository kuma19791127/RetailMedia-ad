import os

fp = 'c:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

new_endpoint = '''
app.get('/api/auth/users', (req, res) => {
    const userList = [];
    for (const email in users) {
        userList.push({ email: email, name: users[email].name || email.split('@')[0], role: users[email].role, org: users[email].org || 'Demo Corp' });
    }
    res.json({ success: true, users: userList });
});
'''

# insert it before app.post('/api/auth/reset-password')
if "app.get('/api/auth/users'" not in content:
    content = content.replace("app.post('/api/auth/reset-password'", new_endpoint + "\napp.post('/api/auth/reset-password'")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added /api/auth/users to server_retail_dist.js")
