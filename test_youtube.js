const http = require('http');

const data = JSON.stringify({
    title: "Test YouTube Video",
    src: "https://www.youtube.com/shorts/3iV5kHLEiZI",
    format: "縦型 (Shorts)",
    isAd: false
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/creator/upload',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', chunk => responseData += chunk);
    res.on('end', () => console.log('Response:', responseData));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();