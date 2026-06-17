const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({default: f}) => f(...args)));

async function testLogin() {
    try {
        console.log("Sending login request to prod...");
        const res = await fetch('https://nsg3hyme2k.us-east-1.awsapprunner.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "buzzkun0807@gmail.com", password: "9838loVE", role: "admin" })
        });
        const data = await res.json();
        console.log("Response Status:", res.status);
        console.log("Response Body:", data);
    } catch(e) {
        console.error("Test login failed:", e);
    }
}
testLogin();
