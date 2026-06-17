async function reset2FAProduction() {
    const baseUrl = 'https://nsg3hyme2k.us-east-1.awsapprunner.com';
    const targets = ['buzzkun0807@gmail.com', 'admin_test_buzz@gmail.com'];

    for (const email of targets) {
        console.log(`Sending reset 2FA request to production for: ${email}`);
        const res = await fetch(`${baseUrl}/api/auth/reset-2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        console.log(`Result for ${email} - Status:`, res.status);
        const data = await res.json();
        console.log('Response:', data);
    }
}

reset2FAProduction().catch(console.error);
