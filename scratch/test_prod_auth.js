async function verifyHtml() {
    try {
        console.log("Fetching production review.html...");
        const res = await fetch('https://nsg3hyme2k.us-east-1.awsapprunner.com/review.html');
        const text = await res.text();
        console.log("Contains console.log?:", text.includes("[Auth] Form submitted"));
    } catch (e) {
        console.error("Error:", e);
    }
}

verifyHtml();
