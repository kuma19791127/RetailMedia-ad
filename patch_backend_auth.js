const fs = require('fs');

const target = 'C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js';
let txt = fs.readFileSync(target, 'utf8');

// 1. In S3 pull mechanism
const sTarget1 = `        if (parsed.globalDashboardStats && typeof globalDashboardStats !== 'undefined') {
            Object.assign(globalDashboardStats, parsed.globalDashboardStats);
        }`;
const sRepl1 = sTarget1 + `
        if (parsed.users && typeof users !== 'undefined') {
            Object.assign(users, parsed.users);
        }`;

// 2. In S3 push mechanism
const sTarget2 = `                globalSensorLogs: typeof globalSensorLogs !== 'undefined' ? globalSensorLogs : []`;
const sRepl2 = sTarget2 + `,
                users: typeof users !== 'undefined' ? users : {}`;

if (!txt.includes('parsed.users')) {
    txt = txt.replace(sTarget1, sRepl1);
    txt = txt.replace(sTarget2, sRepl2);
}

// 3. /api/auth/login needs to auto-register if not found and password valid
const aTarget1 = `app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const user = users[email];
    if (user && user.password === password) {
        console.log(\`[Auth] ✅ Login Success: \${email}\`);
        currentUser = { email, role: user.role }; // Set Session
        res.json({ success: true, redirect: getRedirectUrl(user.role) });
    } else {
        console.log(\`[Auth] ❌ Login Failed: \${email}\`);
        res.json({ success: false, error: "Invalid Email or Password" });
    }
});`;

const aRepl1 = `app.post('/api/auth/login', (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    let user = users[email];
    
    // Auto-Register if user does not exist (to keep the ease of demo but persist data)
    if (!user) {
        users[email] = { password, role: role || "store" };
        user = users[email];
        console.log(\`[Auth] 🆕 Auto-Registered & Logged in: \${email} (\${user.role})\`);
        currentUser = { email, role: user.role };
        return res.json({ success: true, redirect: getRedirectUrl(user.role) });
    }

    if (user && user.password === password) {
        console.log(\`[Auth] ✅ Login Success: \${email}\`);
        currentUser = { email, role: user.role }; // Set Session
        res.json({ success: true, redirect: getRedirectUrl(user.role) });
    } else {
        console.log(\`[Auth] ❌ Login Failed: \${email}\`);
        res.json({ success: false, error: "Invalid Email or Password" });
    }
});`;

if (txt.includes(`    const user = users[email];
    if (user && user.password === password) {`)) {
    txt = txt.replace(aTarget1, aRepl1);
    console.log("Patched /api/auth/login");
} else {
    // maybe slight format string diff
    const reg = /app\.post\('\/api\/auth\/login', \(req, res\) => \{[\s\S]*?\}\);/;
    txt = txt.replace(reg, aRepl1);
    console.log("Patched /api/auth/login with RegEx");
}

fs.writeFileSync(target, txt, 'utf8');
console.log("Backend S3 Auth Sync Applied");
