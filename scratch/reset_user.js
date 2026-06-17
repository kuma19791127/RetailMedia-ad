const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('retail_media.db');

db.run('DELETE FROM users WHERE email = ?', ['buzzkun0807@gmail.com'], (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Successfully deleted buzzkun0807@gmail.com from users table.');
    }
    db.close();
});
