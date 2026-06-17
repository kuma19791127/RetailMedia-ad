const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({default: f}) => f(...args)));

async function getProdUsers() {
    try {
        const res = await fetch('https://nsg3hyme2k.us-east-1.awsapprunner.com/api/auth/users');
        const data = await res.json();
        console.log("=== Production Users ===");
        console.log(JSON.stringify(data.users, null, 2));
    } catch (e) {
        console.error("Failed to fetch prod users:", e);
    }
}
getProdUsers();
