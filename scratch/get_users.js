const db = require('../db_connector');

setTimeout(async () => {
    try {
        const rows = await db.query.all('SELECT email, role FROM users');
        console.log("=== DB Users ===");
        console.log(JSON.stringify(rows, null, 2));
    } catch(e) {
        console.error("Error querying DB:", e);
    }
    process.exit(0);
}, 2000);
