import os

fp = 'c:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# Using a more robust replace by slicing or regex on the specific lines
import re

content = re.sub(
    r"app\.post\('/api/auth/login', \(req, res\) => \{.*?\n\}\);",
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
        // Update name and org if provided and different
        let updated = false;
        if (name && user.name !== name) { user.name = name; updated = true; }
        if (org && user.org !== org) { user.org = org; updated = true; }
        if (updated) saveUsers();
    }
    
    // We must send the response! (Original had res.json at the end too? Wait!)
    res.json({ success: true, user: { email, role: user.role, name: user.name, org: user.org } });
});""",
    content,
    flags=re.DOTALL
)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
