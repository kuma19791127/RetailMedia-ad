const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '..', 'retail_media.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking SQLite users table:');
db.all("SELECT * FROM users WHERE email = 'buzzkun0807@gmail.com'", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('SQLite Row:', JSON.stringify(rows, null, 2));
    }
    
    // Check database.json
    try {
        const dbJsonPath = path.resolve(__dirname, '..', 'database.json');
        const dbJson = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
        console.log('database.json user:', JSON.stringify(dbJson.users['buzzkun0807@gmail.com'], null, 2));
    } catch (e) {
        console.error(e);
    }
    
    db.close();
});
