const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({default: f}) => f(...args)));

async function queryIp() {
    try {
        console.log("Querying production outbound IP...");
        const res = await fetch('https://nsg3hyme2k.us-east-1.awsapprunner.com/api/debug/outbound-ip');
        if (!res.ok) {
            console.log("Server not ready or error:", res.status);
            return;
        }
        const data = await res.json();
        console.log("=== Outbound IP ===");
        console.log(data);
    } catch(e) {
        console.error("Fetch error (deployment might still be in progress):", e.message);
    }
}
queryIp();
