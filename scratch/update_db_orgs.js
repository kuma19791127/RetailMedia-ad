const dbHelper = require('../db_connector');

async function run() {
    try {
        console.log('[Setup] Waiting for DB connection...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('[Setup] Updating demo users org fields in SQLite...');
        await dbHelper.query.run("UPDATE users SET org = ? WHERE email = ? AND role = ?", ['1000001', 'store@demo.com', 'store']);
        await dbHelper.query.run("UPDATE users SET org = ? WHERE email = ? AND role = ?", ['ADV_001', 'advertiser@demo.com', 'advertiser']);
        
        // Verification
        const storeUser = await dbHelper.query.get("SELECT email, role, org FROM users WHERE email = 'store@demo.com' AND role = 'store'");
        const advUser = await dbHelper.query.get("SELECT email, role, org FROM users WHERE email = 'advertiser@demo.com' AND role = 'advertiser'");
        
        console.log('Store User:', storeUser);
        console.log('Advertiser User:', advUser);
        console.log('[Setup] Done.');
        process.exit(0);
    } catch (e) {
        console.error('Error updating DB orgs:', e);
        process.exit(1);
    }
}

run();
