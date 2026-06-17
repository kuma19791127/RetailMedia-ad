const http = require('http');

function postJSON(path, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: body ? JSON.parse(body) : null
                });
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function getWithCookie(path, cookie) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            headers: {
                'Cookie': cookie || ''
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: body ? JSON.parse(body) : null
                });
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTest() {
    console.log("=== 1. ログインテスト開始 ===");
    try {
        const loginRes = await postJSON('/api/auth/login', {
            email: 'advertiser@demo.com',
            password: 'DemoPass2026!',
            role: 'advertiser'
        });
        console.log("Login HTTP Status:", loginRes.status);
        console.log("Login Body:", loginRes.body);
        console.log("Login Headers (Set-Cookie):", loginRes.headers['set-cookie']);

        const cookies = loginRes.headers['set-cookie'];
        let tokenCookie = '';
        if (cookies) {
            tokenCookie = cookies.find(c => c.startsWith('token='));
        }

        console.log("\n=== 2. /api/user/me 疎通確認 ===");
        console.log("Sending token cookie:", tokenCookie);
        const meRes = await getWithCookie('/api/user/me', tokenCookie);
        console.log("/me HTTP Status:", meRes.status);
        console.log("/me Body:", meRes.body);
    } catch (err) {
        console.error("Test Error:", err);
    }
}

runTest();
