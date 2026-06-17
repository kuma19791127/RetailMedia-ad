const https = require('https');

function checkUrl(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            console.log(`[URL] ${url}`);
            console.log(`[Status] ${res.statusCode}`);
            resolve(res.statusCode);
        }).on('error', (e) => {
            console.error(`[Error] ${url}: ${e.message}`);
            resolve(null);
        });
    });
}

async function run() {
    await checkUrl('https://retail-media-db-2026.s3.us-east-1.amazonaws.com/app-debug.apk');
}
run();
