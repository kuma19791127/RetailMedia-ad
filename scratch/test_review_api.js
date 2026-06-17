const API_BASE = 'http://localhost:3000';

async function runTest() {
    console.log("[Test] Running AI Review content validation...");
    const fetch = (await import('node-fetch')).default;

    // Test 1: Upload mock video with no api key configured (Fallback validation)
    console.log("[Test 1] Sending review request with dummy video...");
    const res1 = await fetch(`${API_BASE}/api/creator/review-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            video_base64: 'data:video/mp4;base64,' + 'A'.repeat(1000),
            title: 'Test Video.mp4'
        })
    });
    console.log("[Test 1] Status:", res1.status);
    console.log("[Test 1] Response:", await res1.json());

    // Test 2: Upload mock video containing bad keyword in title
    console.log("[Test 2] Sending review request with bad keyword in title...");
    const res2 = await fetch(`${API_BASE}/api/creator/review-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            video_base64: 'data:video/mp4;base64,' + 'A'.repeat(1000),
            title: '警告！システムがウイルスに感染しています'
        })
    });
    console.log("[Test 2] Status:", res2.status);
    console.log("[Test 2] Response:", await res2.json());

    process.exit(0);
}

runTest();
