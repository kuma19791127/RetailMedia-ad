const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Load environment variables from .env_utf8 or .env
const envPath = fs.existsSync(path.join(__dirname, '.env_utf8')) 
    ? path.join(__dirname, '.env_utf8') 
    : path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL || 'sqlite://./retail_media.db';
const dbFilePath = databaseUrl.replace(/^sqlite:\/\//, '');
const absoluteDbPath = path.resolve(__dirname, dbFilePath);

console.log(`[Database] Connecting to SQLite database at: ${absoluteDbPath}`);

const db = new sqlite3.Database(absoluteDbPath, (err) => {
    if (err) {
        console.error('[Database] Failed to connect to SQLite:', err.message);
    } else {
        console.log('[Database] Connected successfully to SQLite database.');
    }
});

// Promise wrappers
const query = {
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    },
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

// Initialize schema
async function initSchema() {
    try {
        // Users Table
        await query.run(`
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                name TEXT,
                org TEXT,
                two_factor_secret TEXT
            )
        `);

        // Campaigns Table
        await query.run(`
            CREATE TABLE IF NOT EXISTS campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                start_date TEXT,
                end_date TEXT,
                budget REAL DEFAULT 0.0,
                spend REAL DEFAULT 0.0,
                impressions INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending'
            )
        `);

        // Stores Table
        await query.run(`
            CREATE TABLE IF NOT EXISTS stores (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                billing_email TEXT,
                bank_name TEXT,
                branch_name TEXT,
                account_number TEXT,
                account_holder TEXT,
                total_pos_sales REAL DEFAULT 0.0,
                total_ad_revenue REAL DEFAULT 0.0,
                monthly_operating_cost REAL DEFAULT 0.0
            )
        `);

        // POS Transactions Table
        await query.run(`
            CREATE TABLE IF NOT EXISTS pos_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                store_id TEXT,
                timestamp TEXT,
                total_amount REAL,
                FOREIGN KEY(store_id) REFERENCES stores(id)
            )
        `);

        // Sensor Logs Table
        await query.run(`
            CREATE TABLE IF NOT EXISTS sensor_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                metric_name TEXT,
                metric_value REAL
            )
        `);

        // Migration: Add monthly_operating_cost to stores if not exists
        try {
            await query.run("ALTER TABLE stores ADD COLUMN monthly_operating_cost REAL DEFAULT 0.0");
            console.log('[Database] ✅ SQLite stores table migrated (added monthly_operating_cost).');
        } catch (e) {
            // Already exists, ignore
        }

        console.log('[Database] Database tables initialized successfully.');
    } catch (err) {
        console.error('[Database] Error initializing database tables:', err.message);
    }
}

// Automatically initialize schema on load
initSchema();

module.exports = {
    db,
    query
};
