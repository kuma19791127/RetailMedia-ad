const API_BASE = 'http://localhost:3000';

async function testAuth(fetch, role, email, password) {
    console.log(`[Test] Attempting login for Role: ${role}, Email: ${email}`);
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        const status = res.status;
        const data = await res.json();
        console.log(`[Test] Status: ${status}, Response:`, JSON.stringify(data));
        return { success: data.success, cookies: res.headers.raw()['set-cookie'] };
    } catch (e) {
        console.error(`[Test] Login error:`, e.message);
        return { success: false };
    }
}

async function run() {
    console.log("[Test] Running E2E local verification...");
    const fetch = (await import('node-fetch')).default;
    
    const adminRes = await testAuth(fetch, 'admin', 'admin@demo.com', 'demo1234!!');
    const storeRes = await testAuth(fetch, 'store', 'store@demo.com', 'demo1234!!');
    const reviewRes = await testAuth(fetch, 'review', 'reviewer@demo.com', 'demo1234!!');

    console.log(`[Test] E2E Verification Complete.`);
    process.exit(0);
}

run();
