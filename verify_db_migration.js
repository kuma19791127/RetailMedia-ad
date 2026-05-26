const { query } = require('./db');

async function testDatabase() {
    console.log('[Verification] Testing SQLite database schema and values...');
    
    try {
        // Test 1: Check users table
        const users = await query.all('SELECT * FROM users');
        console.log(`[Verification] ✅ Users Table: Found ${users.length} users.`);
        users.forEach(u => console.log(`  - ${u.email} (${u.role})`));

        // Test 2: Check campaigns table
        const campaigns = await query.all('SELECT * FROM campaigns');
        console.log(`[Verification] ✅ Campaigns Table: Found ${campaigns.length} campaigns.`);

        // Test 3: Check stores table
        const stores = await query.all('SELECT * FROM stores');
        console.log(`[Verification] ✅ Stores Table: Found ${stores.length} stores.`);

        console.log('[Verification] All basic SQLite tests passed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('[Verification] ❌ SQLite verification failed:', err.message);
        process.exit(1);
    }
}

testDatabase();
