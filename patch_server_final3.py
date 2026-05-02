import os

fp = 'c:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

new_login = """app.post('/api/auth/login', (req, res) => {
    const { email, password, role, name, org } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    let user = users[email];

    // Auto-Register if user does not exist (to keep the ease of demo but persist data)
    if (!user) {
        users[email] = { password, role: role || "store", name: name, org: org };
        user = users[email];
        console.log(`[Auth] 🆕 Auto-Registered & Logged in: ${email} (${user.role})`);
        currentUser = { email, role: user.role };
        saveUsers();
        return res.json({ success: true, redirect: getRedirectUrl(user.role), user: { email, role: user.role, name: user.name, org: user.org } });
    } else {
        // Update name and org if provided and different
        let updated = false;
        if (name && user.name !== name) { user.name = name; updated = true; }
        if (org && user.org !== org) { user.org = org; updated = true; }
        if (updated) saveUsers();
    }

    if (user && user.password === password) {
        console.log(`[Auth] ✅ Login Success: ${email}`);
        currentUser = { email, role: user.role }; // Set Session
        res.json({ success: true, redirect: getRedirectUrl(user.role), user: { email, role: user.role, name: user.name, org: user.org } });
    } else {
        console.log(`[Auth] ❌ Login Failed: ${email}`);
        res.json({ success: false, error: "Invalid Email or Password" });
    }
});"""

import re
content = re.sub(r"app\.post\('/api/auth/login', \(req, res\) => \{.*?\n\}\);", new_login, content, flags=re.DOTALL)

# Add /api/auth/users
new_endpoint = '''
app.get('/api/auth/users', (req, res) => {
    const userList = [];
    for (const email in users) {
        userList.push({ email: email, name: users[email].name || email.split('@')[0], role: users[email].role, org: users[email].org || 'Demo Corp' });
    }
    res.json({ success: true, users: userList });
});
'''

# insert it right after the login endpoint
content = content.replace("app.post('/api/auth/reset-password', (req, res) => {", new_endpoint + "\napp.post('/api/auth/reset-password', (req, res) => {", 1)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed final!")
