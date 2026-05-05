const fetch = require('node-fetch');
(async () => {
    try {
        const payload = {
            name: "Test Ad Dash",
            budget: "1000",
            start: "2026-05-01",
            end: "2026-05-02",
            plan: "impression",
            trigger: null,
            target_imp: 1000,
            targeting: { gender: "all", age: "all", time: "all" },
            youtube_url: "",
            url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            filename: "test.png",
            format: "image",
            ad_email: "test@example.com"
        };
        const res = await fetch('http://localhost:3000/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch(e) {
        console.error(e);
    }
})();
