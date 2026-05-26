const fs = require('fs');
const path = require('path');
const { query } = require('./db');

async function runMigration() {
    console.log('[Migration] Starting database migration from database.json to SQLite...');
    
    const jsonPath = path.join(__dirname, 'database.json');
    if (!fs.existsSync(jsonPath)) {
        console.error(`[Migration] Error: Source database.json not found at ${jsonPath}`);
        process.exit(1);
    }

    let data;
    try {
        const jsonContent = fs.readFileSync(jsonPath, 'utf8');
        data = JSON.parse(jsonContent);
    } catch (err) {
        console.error('[Migration] Failed to parse database.json:', err.message);
        process.exit(1);
    }

    try {
        // Wait a small amount of time for db.js table creation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 1. Migrate Users
        if (data.users) {
            console.log('[Migration] Migrating users...');
            for (const [email, userDetails] of Object.entries(data.users)) {
                await query.run(
                    `INSERT OR REPLACE INTO users (email, password, role, name, org, two_factor_secret) VALUES (?, ?, ?, ?, ?, ?)`,
                    [email, userDetails.password, userDetails.role, userDetails.name || null, userDetails.org || null, userDetails.twoFactorSecret || null]
                );
            }
            console.log(`[Migration] Migrated ${Object.keys(data.users).length} users.`);
        }

        // 2. Migrate Campaigns
        if (Array.isArray(data.campaigns)) {
            console.log('[Migration] Migrating campaigns...');
            for (const campaign of data.campaigns) {
                await query.run(
                    `INSERT OR REPLACE INTO campaigns (id, name, start_date, end_date, budget, spend, impressions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [campaign.id, campaign.name, campaign.start, campaign.end, campaign.budget, campaign.spend, campaign.imp, campaign.status]
                );
            }
            console.log(`[Migration] Migrated ${data.campaigns.length} campaigns.`);
        }

        // 3. Migrate Store Data
        if (data.storeData) {
            console.log('[Migration] Migrating store data...');
            let storeCount = 0;
            for (const [storeKey, store] of Object.entries(data.storeData)) {
                const bank = store.bank_info || {};
                await query.run(
                    `INSERT OR REPLACE INTO stores (id, name, billing_email, bank_name, branch_name, account_number, account_holder, total_pos_sales, total_ad_revenue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        store.id || storeKey,
                        store.name || 'Demo Store',
                        store.billing_email || '',
                        bank.bank_name || '',
                        bank.branch_name || '',
                        bank.account_number || '',
                        bank.account_holder || '',
                        store.total_pos_sales || 0.0,
                        store.total_ad_revenue || 0.0
                    ]
                );
                storeCount++;
            }
            console.log(`[Migration] Migrated ${storeCount} stores.`);
        }

        // 4. Migrate POS Transactions
        if (Array.isArray(data.posTransactions)) {
            console.log('[Migration] Migrating POS transactions...');
            for (const tx of data.posTransactions) {
                await query.run(
                    `INSERT INTO pos_transactions (store_id, timestamp, total_amount) VALUES (?, ?, ?)`,
                    [tx.storeId || 'default_store', tx.timestamp || new Date().toISOString(), tx.amount || 0.0]
                );
            }
            console.log(`[Migration] Migrated ${data.posTransactions.length} POS transactions.`);
        }

        console.log('[Migration] Database migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('[Migration] Critical migration error:', err.message);
        process.exit(1);
    }
}

runMigration();
