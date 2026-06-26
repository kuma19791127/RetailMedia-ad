const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('retail_media.db', (err) => {
    if (err) {
        console.error("Error connecting to DB:", err.message);
        return;
    }
    console.log("Connected to SQLite retail_media.db");
});

db.all("SELECT email, role, two_factor_secret FROM users", [], (err, rows) => {
    if (err) {
        console.error("Error executing query:", err.message);
        return;
    }
    console.log("--- SQLite Users 2FA secrets ---");
    rows.forEach((row) => {
        console.log(`Email: ${row.email}, Role: ${row.role}, Secret: ${JSON.stringify(row.two_factor_secret)} (type: ${typeof row.two_factor_secret})`);
    });
    db.close();
});
