const { Pool } = require('pg');

const getDatabaseRole = (role) => {
    return role;
};

let pool = null;
let dbWrapper = null;

if (process.env.DATABASE_URL) {
    console.log('[DB] DATABASE_URL が設定されています。PostgreSQLに接続します...');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // RDS等のクラウドDB必須設定
    });

    // 起動時にテーブルを自動作成
    const initDB = async () => {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    email VARCHAR(255),
                    password TEXT NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    name VARCHAR(255),
                    org VARCHAR(255),
                    two_factor_secret VARCHAR(255),
                    PRIMARY KEY (email, role)
                );
                
                CREATE TABLE IF NOT EXISTS campaigns (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    start_date VARCHAR(100),
                    end_date VARCHAR(100),
                    budget DOUBLE PRECISION DEFAULT 0.0,
                    spend DOUBLE PRECISION DEFAULT 0.0,
                    impressions INT DEFAULT 0,
                    status VARCHAR(50) DEFAULT 'pending'
                );

                CREATE TABLE IF NOT EXISTS stores (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    billing_email VARCHAR(255),
                    bank_name VARCHAR(255),
                    branch_name VARCHAR(255),
                    account_number VARCHAR(255),
                    account_holder VARCHAR(255),
                    total_pos_sales DOUBLE PRECISION DEFAULT 0.0,
                    total_ad_revenue DOUBLE PRECISION DEFAULT 0.0,
                    monthly_operating_cost DOUBLE PRECISION DEFAULT 0.0,
                    monthly_labor_cost DOUBLE PRECISION DEFAULT 0.0,
                    monthly_adsense_revenue DOUBLE PRECISION DEFAULT 0.0
                );

                CREATE TABLE IF NOT EXISTS pos_transactions (
                    id SERIAL PRIMARY KEY,
                    store_id VARCHAR(255) REFERENCES stores(id) ON DELETE SET NULL,
                    timestamp VARCHAR(100),
                    total_amount DOUBLE PRECISION
                );

                CREATE TABLE IF NOT EXISTS sensor_logs (
                    id SERIAL PRIMARY KEY,
                    timestamp VARCHAR(100),
                    metric_name VARCHAR(255),
                    metric_value DOUBLE PRECISION
                );

                CREATE TABLE IF NOT EXISTS face_sensor_logs (
                    id SERIAL PRIMARY KEY,
                    timestamp VARCHAR(100),
                    gender VARCHAR(50),
                    age INT,
                    ad_id TEXT
                );

                CREATE TABLE IF NOT EXISTS products (
                    jan_code VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    price INT NOT NULL DEFAULT 0,
                    category VARCHAR(255)
                );
            `);

            // Migration path: Drop existing primary key constraint and recreate as composite if not already done
            try {
                await pool.query(`
                    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
                    ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (email, role);
                `);
                console.log('[DB] ✅ Users constraint migrated to composite primary key (email, role).');
            } catch (e) {
                // If migration fails because it is already composite, ignore
            }

            // Migration path: Normalize advertiser/agency/creator/retailer roles to store role (DEPRECATED - Roles are now preserved)
            console.log('[DB] Users roles migration bypassed (roles are preserved).');

            // 初期データの投入 (空の場合のみ)
            const countRes = await pool.query('SELECT COUNT(*) FROM products');
            if (parseInt(countRes.rows[0].count, 10) === 0) {
                const defaultProducts = [
                    ['4580347721500', 'ライフプレミアム 天然水 2L', 98, '飲料・水'],
                    ['4901335109634', 'スマイルライフ ポテトチップス うすしお味 60g', 78, '菓子'],
                    ['4902586066288', 'スマイルライフ 切り落としベーコン 180g', 386, '加工肉'],
                    ['4901901124122', 'スマイルライフ フィッシュソーセージ 1束 (65g×5)', 298, '加工肉'],
                    ['4902586262840', 'スマイルライフロースハム 90g', 258, '加工肉'],
                    ['4902586262970', 'スマイルライフ ハーフベーコン 80g', 238, '加工肉'],
                    ['4971958025628', 'スマイルライフ 国産小結びしらたき 6粒入', 128, '納豆・練物・豆腐'],
                    ['4901530201683', 'スマイルライフ さつま揚 6枚入', 198, '納豆・練物・豆腐'],
                    ['4901530201706', 'スマイルライフ ふんわりはんぺん 1枚入', 108, '納豆・練物・豆腐'],
                    ['4901320265260', 'スマイルライフ かまぼこ 赤 80g', 158, '納豆・練物・豆腐'],
                    ['4535582304032', 'スマイルライフ ほうじ茶 500ml', 88, '飲料・水'],
                    ['4535582304018', 'スマイルライフ 緑茶 500ml', 88, '飲料・水'],
                    ['4535582304025', 'スマイルライフ ジャスミン茶 500ml', 88, '飲料・水'],
                    ['4939505130737', 'スマイルライフ 烏龍茶 500ml', 88, '飲料・水']
                ];
                for (const prod of defaultProducts) {
                    await pool.query(
                        'INSERT INTO products (jan_code, name, price, category) VALUES ($1, $2, $3, $4) ON CONFLICT (jan_code) DO NOTHING',
                        prod
                    );
                }
                console.log('[DB] ✅ 初期商品マスタの登録が完了しました。');
            }

            // ユーザーデータの同期 (database.json のユーザー情報を PostgreSQL の users テーブルにインポート)
            const fs = require('fs');
            const path = require('path');
            const jsonPath = path.resolve(__dirname, 'database.json');
            if (fs.existsSync(jsonPath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                    if (data.users) {
                        for (const [key, userDetails] of Object.entries(data.users)) {
                            let email = key;
                            let role = userDetails.role;
                            if (key.includes(':')) {
                                const parts = key.split(':');
                                email = parts[0];
                                role = parts[1];
                            }
                            await pool.query(
                                `INSERT INTO users (email, password, role, name, org, two_factor_secret) 
                                 VALUES ($1, $2, $3, $4, $5, $6) 
                                 ON CONFLICT (email, role) DO UPDATE 
                                 SET password = EXCLUDED.password, 
                                     name = EXCLUDED.name,
                                     org = EXCLUDED.org,
                                     two_factor_secret = COALESCE(users.two_factor_secret, EXCLUDED.two_factor_secret)`,
                                [email, userDetails.password, getDatabaseRole(role), userDetails.name || null, userDetails.org || null, userDetails.twoFactorSecret || null]
                            );
                        }
                        console.log('[DB] ✅ Users synchronized from database.json to PostgreSQL.');
                    }
                } catch (e) {
                    console.error('[DB] ❌ Users synchronization error:', e);
                }
            }

            // Migration: Add monthly_operating_cost column to stores table if not exists
            try {
                await pool.query("ALTER TABLE stores ADD COLUMN IF NOT EXISTS monthly_operating_cost DOUBLE PRECISION DEFAULT 0.0");
                console.log('[DB] ✅ PostgreSQL stores table migrated (added monthly_operating_cost).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL stores table migration failed (monthly_operating_cost):', e.message);
            }

            // Migration: Add monthly_labor_cost column to stores table if not exists
            try {
                await pool.query("ALTER TABLE stores ADD COLUMN IF NOT EXISTS monthly_labor_cost DOUBLE PRECISION DEFAULT 0.0");
                console.log('[DB] ✅ PostgreSQL stores table migrated (added monthly_labor_cost).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL stores table migration failed (monthly_labor_cost):', e.message);
            }

            // Migration: Add monthly_adsense_revenue column to stores table if not exists
            try {
                await pool.query("ALTER TABLE stores ADD COLUMN IF NOT EXISTS monthly_adsense_revenue DOUBLE PRECISION DEFAULT 0.0");
                console.log('[DB] ✅ PostgreSQL stores table migrated (added monthly_adsense_revenue).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL stores table migration failed (monthly_adsense_revenue):', e.message);
            }

            console.log('[DB] ✅ PostgreSQLのテーブル初期化が完了しました。');
        } catch (e) {
            console.error('[DB] ❌ テーブル作成エラー:', e);
        }
    };
    initDB();

    // プレースホルダーを ? から $1, $2... に自動変換するヘルパー
    const convertSql = (sql) => {
        let index = 1;
        return sql.replace(/\?/g, () => `$${index++}`);
    };

    dbWrapper = {
        pool: pool,
        query: {
            async get(sql, params = []) {
                const res = await pool.query(convertSql(sql), params);
                return res.rows[0] || null;
            },
            async all(sql, params = []) {
                const res = await pool.query(convertSql(sql), params);
                return res.rows;
            },
            async run(sql, params = []) {
                const res = await pool.query(convertSql(sql), params);
                return { lastID: null, changes: res.rowCount };
            }
        }
    };

} else {
    console.log('[DB] ⚠️ DATABASE_URL が未設定です。ローカルの SQLite を動的に使用します。');
    
    // AWS環境でsqlite3のロード失敗を防ぐため、ローカル実行時のみ動的にインポート
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const absoluteDbPath = path.resolve(__dirname, 'retail_media.db');

    const sqliteDb = new sqlite3.Database(absoluteDbPath, (err) => {
        if (err) {
            console.error('[Database] Failed to connect to SQLite:', err.message);
        } else {
            console.log('[Database] Connected successfully to SQLite database.');
            
            // SQLite テーブル初期化と初期データ登録
            sqliteDb.serialize(() => {
                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS products (
                        jan_code TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        price INTEGER NOT NULL DEFAULT 0,
                        category TEXT
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS face_sensor_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT,
                        gender TEXT,
                        age INTEGER,
                        ad_id TEXT
                    )
                `);

                // Recreate users table to apply schema change dynamically
                sqliteDb.run("DROP TABLE IF EXISTS users");
                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        email TEXT,
                        password TEXT NOT NULL,
                        role TEXT NOT NULL,
                        name TEXT,
                        org TEXT,
                        two_factor_secret TEXT,
                        PRIMARY KEY (email, role)
                    )
                `);

                sqliteDb.get("SELECT COUNT(*) as count FROM products", (err, row) => {
                    if (row && row.count === 0) {
                        const defaultProducts = [
                            ['4580347721500', 'ライフプレミアム 天然水 2L', 98, '飲料・水'],
                            ['4901335109634', 'スマイルライフ ポテトチップス うすしお味 60g', 78, '菓子'],
                            ['4902586066288', 'スマイルライフ 切り落としベーコン 180g', 386, '加工肉'],
                            ['4901901124122', 'スマイルライフ フィッシュソーセージ 1束 (65g×5)', 298, '加工肉'],
                            ['4902586262840', 'スマイルライフロースハム 90g', 258, '加工肉'],
                            ['4902586262970', 'スマイルライフ ハーフベーコン 80g', 238, '加工肉'],
                            ['4971958025628', 'スマイルライフ 国産小結びしらたき 6粒入', 128, '納豆・練物・豆腐'],
                            ['4901530201683', 'スマイルライフ さつま揚 6枚入', 198, '納豆・練物・豆腐'],
                            ['4901530201706', 'スマイルライフ ふんわりはんぺん 1枚入', 108, '納豆・練物・豆腐'],
                            ['4901320265260', 'スマイルライフ かまぼこ 赤 80g', 158, '納豆・練物・豆腐'],
                            ['4535582304032', 'スマイルライフ ほうじ茶 500ml', 88, '飲料・水'],
                            ['4535582304018', 'スマイルライフ 緑茶 500ml', 88, '飲料・水'],
                            ['4535582304025', 'スマイルライフ ジャスミン茶 500ml', 88, '飲料・水'],
                            ['4939505130737', 'スマイルライフ 烏龍茶 500ml', 88, '飲料・水']
                        ];
                        const stmt = sqliteDb.prepare("INSERT OR IGNORE INTO products (jan_code, name, price, category) VALUES (?, ?, ?, ?)");
                        defaultProducts.forEach(prod => stmt.run(prod));
                        stmt.finalize();
                        console.log('[Database] ✅ SQLite 初期商品マスタの登録が完了しました。');
                    }
                });

                // SQLite Migration: Normalize advertiser/agency/creator/retailer roles to store role (DEPRECATED - Roles are now preserved)

                // database.json からユーザー情報を SQLite の users テーブルに同期
                const fs = require('fs');
                const path = require('path');
                const jsonPath = path.resolve(__dirname, 'database.json');
                if (fs.existsSync(jsonPath)) {
                    try {
                        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                        if (data.users) {
                            const stmt = sqliteDb.prepare(`
                                INSERT INTO users (email, password, role, name, org, two_factor_secret) 
                                VALUES (?, ?, ?, ?, ?, ?)
                                ON CONFLICT(email, role) DO UPDATE SET
                                    password = EXCLUDED.password,
                                    name = EXCLUDED.name,
                                    org = EXCLUDED.org,
                                    two_factor_secret = COALESCE(users.two_factor_secret, EXCLUDED.two_factor_secret)
                            `);
                            for (const [key, userDetails] of Object.entries(data.users)) {
                                let email = key;
                                let role = userDetails.role;
                                if (key.includes(':')) {
                                    const parts = key.split(':');
                                    email = parts[0];
                                    role = parts[1];
                                }
                                stmt.run([
                                    email, 
                                    userDetails.password, 
                                    getDatabaseRole(role), 
                                    userDetails.name || null, 
                                    userDetails.org || null, 
                                    userDetails.twoFactorSecret || null
                                ]);
                            }
                            stmt.finalize();
                            console.log('[Database] ✅ Users synchronized from database.json to SQLite.');
                        }
                    } catch (e) {
                        console.error('[Database] ❌ SQLite Users synchronization error:', e);
                    }
                }
            });
        }
    });

    dbWrapper = {
        pool: null,
        query: {
            run(sql, params = []) {
                return new Promise((resolve, reject) => {
                    sqliteDb.run(sql, params, function(err) {
                        if (err) reject(err);
                        else resolve({ lastID: this.lastID, changes: this.changes });
                    });
                });
            },
            get(sql, params = []) {
                return new Promise((resolve, reject) => {
                    sqliteDb.get(sql, params, (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });
            },
            all(sql, params = []) {
                return new Promise((resolve, reject) => {
                    sqliteDb.all(sql, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });
            }
        }
    };
}

module.exports = dbWrapper;
