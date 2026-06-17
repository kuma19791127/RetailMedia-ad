async function resetPasswordProduction() {
    const email = 'buzzkun0807@gmail.com';
    const password = '9838love';
    const baseUrl = 'https://nsg3hyme2k.us-east-1.awsapprunner.com';

    console.log('Sending reset password request to production...');
    const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    console.log('HTTP Status:', res.status);
    const text = await res.text();
    console.log('Raw response text:', text.substring(0, 300));
}

resetPasswordProduction().catch(console.error);
