const speakeasy = require('speakeasy');

async function testAdminFlow() {
    const email = 'admin_test_buzz@gmail.com';
    const password = 'adminPass2026!';
    const baseUrl = 'https://nsg3hyme2k.us-east-1.awsapprunner.com';

    console.log('--- Step 1: Initial Login (Should Auto-Register and request 2FA Setup) ---');
    let res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' })
    });
    let data = await res.json();
    console.log('Step 1 Response:', data);

    if (data.require2FASetup) {
        console.log('✅ Correctly requested 2FA Setup!');
        
        console.log('--- Step 2: Requesting 2FA credentials ---');
        const setupRes = await fetch(`${baseUrl}/api/auth/2fa/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const setupData = await setupRes.json();
        console.log('2FA Setup Response:', setupData);

        const secret = setupData.secret;
        console.log('Extract secret:', secret);

        console.log('--- Step 3: Enabling 2FA with generated token ---');
        const token = speakeasy.totp({
            secret: secret,
            encoding: 'base32'
        });
        console.log('Generated TOTP token for enabling:', token);

        const enableRes = await fetch(`${baseUrl}/api/auth/2fa/enable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, secret, token })
        });
        const enableData = await enableRes.json();
        console.log('2FA Enable Response:', enableData);

        if (enableData.success) {
            console.log('✅ 2FA Enabled successfully!');

            console.log('--- Step 4: Login again (Should request 2FA Verification) ---');
            const login2Res = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'admin' })
            });
            const login2Data = await login2Res.json();
            console.log('Login 2 (without code) Response:', login2Data);

            if (login2Data.require2FA) {
                console.log('✅ Correctly requested 2FA Verification!');

                console.log('--- Step 5: Logging in with 2FA Token ---');
                const verifyToken = speakeasy.totp({
                    secret: secret,
                    encoding: 'base32'
                });
                console.log('Generated TOTP token for login:', verifyToken);

                const finalRes = await fetch(`${baseUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role: 'admin', totpCode: verifyToken })
                });
                const finalData = await finalRes.json();
                console.log('Final Login Response:', finalData);

                if (finalData.success) {
                    console.log('🎉 Verification Success! Admin Login complete with 2FA.');
                } else {
                    console.error('❌ Final login failed:', finalData.error);
                }
            } else {
                console.error('❌ Failed: Expected 2FA verification request.');
            }
        } else {
            console.error('❌ Failed to enable 2FA:', enableData.error);
        }
    } else {
        console.error('❌ Failed: Expected 2FA setup request on first login.');
    }
}

testAdminFlow().catch(console.error);
