import os

fp = 'c:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the auto-register block
old_login_block = '''app.post('/api/auth/login', (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    let user = users[email];

    // Auto-Register if user does not exist (to keep the ease of demo but persist data)
    if (!user) {
        users[email] = { password, role: role || "store" };
        user = users[email];
        saveUsers();
    }'''

new_login_block = '''app.post('/api/auth/login', (req, res) => {
    const { email, password, role, name, org } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    let user = users[email];

    // Auto-Register if user does not exist (to keep the ease of demo but persist data)
    if (!user) {
        users[email] = { password, role: role || "store", name: name, org: org };
        user = users[email];
        saveUsers();
    } else {
        // Update name and org if provided and different
        let updated = false;
        if (name && user.name !== name) { user.name = name; updated = true; }
        if (org && user.org !== org) { user.org = org; updated = true; }
        if (updated) saveUsers();
    }'''

content = content.replace(old_login_block, new_login_block)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated server_retail_dist.js login logic")
