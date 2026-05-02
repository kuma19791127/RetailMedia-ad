import os
import re

fp = 'c:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix /api/auth/login
content = re.sub(
    r"app\.post\('/api/auth/login', \(req, res\) => \{\s*const \{ email, password, role \} = req\.body;\s*if \(!email \|\| !password\) return res\.status\(400\)\.json\(\{ error: \"Missing fields\" \}\);\s*let user = users\[email\];\s*// Auto-Register if user does not exist \(to keep the ease of demo but persist data\)\s*if \(!user\) \{\s*users\[email\] = \{ password, role: role \|\| \"store\" \};\s*user = users\[email\];\s*saveUsers\(\);\s*\}",
    """app.post('/api/auth/login', (req, res) => {
    const { email, password, role, name, org } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    let user = users[email];

    // Auto-Register if user does not exist (to keep the ease of demo but persist data)
    if (!user) {
        users[email] = { password, role: role || "store", name: name, org: org };
        user = users[email];
        saveUsers();
    } else {
        // Update name and org if provided
        let updated = false;
        if (name && user.name !== name) { user.name = name; updated = true; }
        if (org && user.org !== org) { user.org = org; updated = true; }
        if (updated) saveUsers();
    }""",
    content
)

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

print("Updated server_retail_dist.js properly")
