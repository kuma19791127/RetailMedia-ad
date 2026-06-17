const speakeasy = require('speakeasy');

async function verifyLocal() {
    const email = 'buzzkun0807@gmail.com';
    const password = '9838love';
    const secret = 'ONSFEU3WOVZVIOLPFIUT66ZQIM4VMTCBNNAWYWBPKI2G6TJMKJWA';
    const baseUrl = 'http://localhost:3000';

    console.log('--- Step 1: Login with password ---');
    let res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'store' })
    });
    let data = await res.json();
    console.log('Step 1 Login Result:', data);

    if (data.require2FA) {
        console.log('✅ Correctly triggered 2FA transition!');
        
        console.log('--- Step 2: Generating TOTP and verifying ---');
        const token = speakeasy.totp({
            secret: secret,
            encoding: 'base32'
        });
        console.log('Generated TOTP token:', token);

        res = await fetch(`${baseUrl}/api/auth/2fa/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token: token })
        });
        data = await res.json();
        console.log('Step 2 Verification Result:', data);

        if (data.success) {
            console.log('🎉 Verification Success! Login complete with 2FA.');
        } else {
            console.error('❌ Verification failed:', data.error);
        }
    } else if (data.require2FASetup) {
        console.log('ℹ️ Requires 2FA Setup instead of verify.');
    } else {
        console.error('❌ Failed: Expected 2FA trigger.');
    }
}

verifyLocal().catch(console.error);
