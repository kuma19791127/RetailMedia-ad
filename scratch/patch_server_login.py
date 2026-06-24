import os

server_path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\server_retail_dist.js"

with open(server_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize
content_norm = content.replace("\r\n", "\n")

# Target 1: app.post('/api/auth/login', ...
target_1 = """app.post('/api/auth/login', async (req, res) => {
    console.log("[API /api/auth/login] Request body:", req.body);
    const { email, password, role, name, org, totpCode } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    try {
        const dbRole = getDatabaseRole(role || 'store');
        let user = await dbHelper.query.get('SELECT * FROM users WHERE email = ? AND role = ?', [email, dbRole]);"""

replacement_1 = """app.post('/api/auth/login', async (req, res) => {
    console.log("[API /api/auth/login] Request body:", req.body);
    const { email, password, role, name, org, totpCode } = req.body;
    if (!email || !password) {
        console.warn("[Auth /api/auth/login] Missing fields: email or password missing");
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        const dbRole = getDatabaseRole(role || 'store');
        console.log(`[Auth /api/auth/login] [Trace 1] Querying DB for email=${email}, role=${dbRole}`);
        let user = await dbHelper.query.get('SELECT * FROM users WHERE email = ? AND role = ?', [email, dbRole]);
        console.log(`[Auth /api/auth/login] [Trace 2] DB query completed. User found: ${!!user}`);"""

# Target 2: verifyPassword password checking
target_2 = """        if (verifyPassword(password, user.password)) {
            const targetRole = role || user.role;"""

replacement_2 = """        console.log(`[Auth /api/auth/login] [Trace 3] Verifying password...`);
        const passwordMatched = verifyPassword(password, user.password);
        console.log(`[Auth /api/auth/login] [Trace 4] Password match result: ${passwordMatched}`);
        if (passwordMatched) {
            const targetRole = role || user.role;"""

# Target 3: speakeasy validation and Speakeasy imports
target_3 = Speakeasy_target = """                        const speakeasy = require('speakeasy');
                        const verified = speakeasy.totp.verify({ secret: user.two_factor_secret, encoding: 'base32', token: totpCode, window: 2 });"""

replacement_3 = """                        console.log(`[Auth /api/auth/login] [Trace speakeasy] Verifying TOTP code: ${totpCode}`);
                        const speakeasy = require('speakeasy');
                        const verified = speakeasy.totp.verify({ secret: user.two_factor_secret, encoding: 'base32', token: totpCode, window: 2 });
                        console.log(`[Auth /api/auth/login] [Trace speakeasy result] Verification: ${verified}`);"""

# Target 4: jwt Token sign
target_4 = """            // ログイン成功時にJWTトークンを発行してCookieにセット (24時間の明示的有効期限を設定してタイムアウトを防止)
            const jwtToken = jwt.sign({ email, role: targetRole, name: user.name, org: user.org }, JWT_SECRET, { expiresIn: '24h' });
            console.log(`[Auth Login Success] Issued token for email: ${email}, role: ${targetRole}, name: ${user.name}`);"""

replacement_4 = """            // ログイン成功時にJWTトークンを発行してCookieにセット (24時間の明示的有効期限を設定してタイムアウトを防止)
            console.log(`[Auth /api/auth/login] [Trace jwt] Signing token for email: ${email}, role: ${targetRole}`);
            const jwtToken = jwt.sign({ email, role: targetRole, name: user.name, org: user.org }, JWT_SECRET, { expiresIn: '24h' });
            console.log(`[Auth Login Success] Issued token for email: ${email}, role: ${targetRole}, name: ${user.name}`);"""

# Target 5: error log catch
target_5 = """    } catch (e) {
        console.error("[Auth Login Error]", e);
        res.status(500).json({ error: e.message });
    }"""

replacement_5 = """    } catch (e) {
        console.error("[Auth /api/auth/login Error] [Trace exception] Login process threw an exception:", e.stack || e.message || e);
        res.status(500).json({ error: "サーバー内部エラーが発生しました: " + e.message });
    }"""

# Normalizing targets
target_1_norm = target_1.replace("\r\n", "\n")
replacement_1_norm = replacement_1.replace("\r\n", "\n")
target_2_norm = target_2.replace("\r\n", "\n")
replacement_2_norm = replacement_2.replace("\r\n", "\n")
target_3_norm = target_3.replace("\r\n", "\n")
replacement_3_norm = replacement_3.replace("\r\n", "\n")
target_4_norm = target_4.replace("\r\n", "\n")
replacement_4_norm = replacement_4.replace("\r\n", "\n")
target_5_norm = target_5.replace("\r\n", "\n")
replacement_5_norm = replacement_5.replace("\r\n", "\n")

modified = False
if target_1_norm in content_norm:
    content_norm = content_norm.replace(target_1_norm, replacement_1_norm)
    modified = True
if target_2_norm in content_norm:
    content_norm = content_norm.replace(target_2_norm, replacement_2_norm)
    modified = True
if target_3_norm in content_norm:
    content_norm = content_norm.replace(target_3_norm, replacement_3_norm)
    modified = True
if target_4_norm in content_norm:
    content_norm = content_norm.replace(target_4_norm, replacement_4_norm)
    modified = True
if target_5_norm in content_norm:
    content_norm = content_norm.replace(target_5_norm, replacement_5_norm)
    modified = True

if modified:
    with open(server_path, "w", encoding="utf-8") as f:
        f.write(content_norm.replace("\n", "\r\n" if "\r\n" in content else "\n"))
    print("Successfully patched login trace logs into server_retail_dist.js.")
else:
    print("Warning: login targets not found or already patched.")
