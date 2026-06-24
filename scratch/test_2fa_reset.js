const http = require('http');

function postJson(url, data) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const postData = JSON.stringify(data);
        const options = {
            hostname: u.hostname,
            port: u.port || 80,
            path: u.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('[Test] Sending 2FA Reset request for advertiserID (ADV_001) as role: store...');
    try {
        const res = await postJson('http://localhost:3000/api/auth/reset-2fa', {
            email: 'ADV_001',
            password: 'DemoPass2026!',
            role: 'store'
        });
        console.log('Response Status:', res.status);
        console.log('Response Body:', res.body);

        const data = JSON.parse(res.body);
        if (res.status === 200 && data.success) {
            console.log('✅ Test passed: Successfully reset 2FA using advertiserID.');
        } else {
            console.log('❌ Test failed:', data.error || 'Unknown error');
        }
    } catch (e) {
        console.error('Test script error:', e);
    }
}

runTests();
