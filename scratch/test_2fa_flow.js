const speakeasy = require('speakeasy');

async function runTest() {
    const email = 'buzzkun0807@gmail.com';
    const password = '9838love';
    const baseUrl = 'https://nsg3hyme2k.us-east-1.awsapprunner.com';

    console.log('--- Step 1: Login to trigger Auto-Registration ---');
    let res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'store' })
    });
    let data = await res.json();
    console.log('Step 1 Result:', data);

    if (!data.require2FASetup) {
        console.error('Failed: Expected require2FASetup to be true');
        return;
    }

    console.log('--- Step 2: Request 2FA Setup (Secret & QR) ---');
    res = await fetch(`${baseUrl}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    data = await res.json();
    console.log('Step 2 Result Secret:', data.secret ? 'Loaded' : 'Not Loaded');

    const secret = data.secret;
    const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32'
    });
    console.log('Generated TOTP token:', token);

    console.log('--- Step 3: Enable 2FA with generated token ---');
    res = await fetch(`${baseUrl}/api/auth/2fa/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, secret })
    });
    data = await res.json();
    console.log('Step 3 Result:', data);

    if (!data.success) {
        console.error('Failed to enable 2FA');
        return;
    }

    console.log('--- Step 4: Login again. Should require 2FA verification ---');
    res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    data = await res.json();
    console.log('Step 4 Result:', data);

    if (!data.require2FA) {
        console.error('Failed: Expected require2FA to be true');
        return;
    }

    console.log('--- Step 5: Verify 2FA and get skip cookie ---');
    const verifyToken = speakeasy.totp({
        secret: secret,
        encoding: 'base32'
    });
    res = await fetch(`${baseUrl}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: verifyToken })
    });
    data = await res.json();
    console.log('Step 5 Result:', data);

    const setCookie = res.headers.get('set-cookie');
    console.log('Set-Cookie Header:', setCookie);

    if (!setCookie || !setCookie.includes('2fa_skip')) {
        console.error('Failed: 2fa_skip cookie not found in response');
        return;
    }

    // Extract skip cookie value
    const cookies = setCookie.split(',').map(c => c.trim().split(';')[0]);
    const skipCookie = cookies.find(c => c.startsWith('2fa_skip='));
    const tokenCookie = cookies.find(c => c.startsWith('token='));
    const combinedCookies = [tokenCookie, skipCookie].filter(Boolean).join('; ');
    console.log('Extracted cookies:', combinedCookies);

    console.log('--- Step 6: Login with 2fa_skip cookie (Should bypass 2FA) ---');
    res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': combinedCookies
        },
        body: JSON.stringify({ email, password })
    });
    data = await res.json();
    console.log('Step 6 Result:', data);

    if (data.success && !data.require2FA && !data.require2FASetup) {
        console.log('🎉 SUCCESS: 2FA verified and 5h-skip cookie bypassed the 2FA dialog successfully!');
    } else {
        console.error('Failed: 2FA was not bypassed');
    }
}

runTest().catch(console.error);
