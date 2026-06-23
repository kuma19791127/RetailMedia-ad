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

    // Prevent uncaught connection errors from crashing the Node.js process (idle client errors)
    pool.on('error', (err) => {
        console.error('[DB PG Pool] Unexpected error on idle PostgreSQL client:', err.message || err);
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
                    status VARCHAR(50) DEFAULT 'pending',
                    advertiser VARCHAR(255),
                    target_org VARCHAR(255),
                    target_scope VARCHAR(50) DEFAULT 'enterprise',
                    target_areas TEXT,
                    target_orgs TEXT,
                    target_prefectures TEXT,
                    target_store_types TEXT
                );

                CREATE TABLE IF NOT EXISTS stores (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    billing_email VARCHAR(255),
                    bank_name VARCHAR(255),
                    branch_name VARCHAR(255),
                    account_number VARCHAR(255),
                    account_holder VARCHAR(255),
                    bank_email VARCHAR(255),
                    area VARCHAR(100),
                    prefecture VARCHAR(255),
                    store_type VARCHAR(255),
                    total_pos_sales DOUBLE PRECISION DEFAULT 0.0,
                    total_ad_revenue DOUBLE PRECISION DEFAULT 0.0,
                    monthly_operating_cost DOUBLE PRECISION DEFAULT 0.0,
                    monthly_labor_cost DOUBLE PRECISION DEFAULT 0.0,
                    monthly_adsense_revenue DOUBLE PRECISION DEFAULT 0.0
                );

                DROP TABLE IF EXISTS pos_transactions;
                CREATE TABLE IF NOT EXISTS pos_transactions (
                    id VARCHAR(255) PRIMARY KEY,
                    company_name VARCHAR(255),
                    store_name VARCHAR(255),
                    total_amount DOUBLE PRECISION,
                    billing_email VARCHAR(255),
                    items TEXT,
                    status VARCHAR(50),
                    timestamp BIGINT
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
                    ad_id TEXT,
                    store_id VARCHAR(100)
                );

                CREATE TABLE IF NOT EXISTS products (
                    jan_code VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    price INT NOT NULL DEFAULT 0,
                    category VARCHAR(255)
                );

                CREATE TABLE IF NOT EXISTS withdrawal_requests (
                    id VARCHAR(255) PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    amount DOUBLE PRECISION DEFAULT 0.0,
                    status VARCHAR(50) DEFAULT 'Pending',
                    timestamp BIGINT,
                    details TEXT
                );

                CREATE TABLE IF NOT EXISTS creator_banks (
                    email VARCHAR(255) PRIMARY KEY,
                    bank_name VARCHAR(255),
                    branch_name VARCHAR(255),
                    account_number VARCHAR(255),
                    account_holder VARCHAR(255),
                    id_base64 TEXT,
                    timestamp BIGINT
                );

                CREATE TABLE IF NOT EXISTS kyc_requests (
                    id VARCHAR(255) PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    org_name VARCHAR(255),
                    person_name VARCHAR(255),
                    corp_id VARCHAR(13),
                    duns VARCHAR(255),
                    documents TEXT,
                    ai_score INT,
                    ai_details TEXT,
                    timestamp BIGINT,
                    status VARCHAR(50) DEFAULT 'pending'
                );

                CREATE TABLE IF NOT EXISTS agency_referrals (
                    advertise_email VARCHAR(255) PRIMARY KEY,
                    agency_email VARCHAR(255) NOT NULL,
                    price DOUBLE PRECISION DEFAULT 0.0,
                    status VARCHAR(50) DEFAULT 'Pending',
                    date VARCHAR(100)
                );

                CREATE TABLE IF NOT EXISTS signage_states (
                    store_id VARCHAR(255) PRIMARY KEY,
                    state_json TEXT
                );

                CREATE TABLE IF NOT EXISTS scheduled_broadcasts (
                    id VARCHAR(255) PRIMARY KEY,
                    title VARCHAR(255),
                    text TEXT,
                    audio_url TEXT,
                    schedule_time VARCHAR(100),
                    target_store_id VARCHAR(255),
                    advertiser VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'pending'
                );

                CREATE TABLE IF NOT EXISTS account_strikes (
                    email VARCHAR(255) PRIMARY KEY,
                    strikes INT DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS admin_settings (
                    key VARCHAR(255) PRIMARY KEY,
                    value TEXT
                );

                CREATE TABLE IF NOT EXISTS local_events (
                    id SERIAL PRIMARY KEY,
                    store_id VARCHAR(100) NOT NULL,
                    event_name VARCHAR(255) NOT NULL,
                    event_date VARCHAR(100),
                    description TEXT
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

            // Migration path: Add store_id column to face_sensor_logs if not exists
            try {
                await pool.query(`
                    ALTER TABLE face_sensor_logs ADD COLUMN IF NOT EXISTS store_id VARCHAR(100);
                `);
                console.log('[DB] ✅ PostgreSQL face_sensor_logs.store_id column added or already exists.');
            } catch (e) {
                console.error('[DB] PostgreSQL face_sensor_logs.store_id migration error:', e.message);
            }

            // Migration path: Add advertiser column to campaigns table if not exists
            try {
                await pool.query(`
                    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS advertiser VARCHAR(255);
                `);
                console.log('[DB] ✅ PostgreSQL campaigns.advertiser column added or already exists.');
            } catch (e) {
                console.error('[DB] PostgreSQL campaigns.advertiser migration error:', e.message);
            }

            // Migration path: Add target_org column to campaigns table if not exists
            try {
                await pool.query(`
                    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_org VARCHAR(255);
                `);
                console.log('[DB] ✅ PostgreSQL campaigns.target_org column added or already exists.');
            } catch (e) {
                console.error('[DB] PostgreSQL campaigns.target_org migration error:', e.message);
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

            // 初期ローカルイベントデータの投入 (空の場合のみ)
            const eventCountRes = await pool.query('SELECT COUNT(*) FROM local_events');
            if (parseInt(eventCountRes.rows[0].count, 10) === 0) {
                const defaultEvents = [
                    ['STORE_001', '近隣小学校の運動会', '2026/06/25', '近隣の小学校で運動会が開催されます。お弁当の需要が高まります。'],
                    ['STORE_001', '地域住民スポーツフェスティバル', '2026/06/28', '地域のスポーツ大会。ドリンクや軽食の需要があります。'],
                    ['STORE_001', '駅前商店街の夕市セール', '2026/06/30', '商店街合同の夕方タイムセールです。']
                ];
                for (const ev of defaultEvents) {
                    await pool.query(
                        'INSERT INTO local_events (store_id, event_name, event_date, description) VALUES ($1, $2, $3, $4)',
                        ev
                    );
                }
                console.log('[DB] ✅ 初期ローカルイベントの登録が完了しました。');
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

            // Migration: Add bank_email column to stores table if not exists
            try {
                await pool.query("ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_email VARCHAR(255)");
                console.log('[DB] ✅ PostgreSQL stores table migrated (added bank_email).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL stores table migration failed (bank_email):', e.message);
            }

            // Migration path: Add area column to stores table if not exists
            try {
                await pool.query("ALTER TABLE stores ADD COLUMN IF NOT EXISTS area VARCHAR(100)");
                console.log('[DB] ✅ PostgreSQL stores table migrated (added area).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL stores table migration failed (area):', e.message);
            }
            
            // Migration path: Add target_scope column to campaigns table if not exists
            try {
                await pool.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_scope VARCHAR(50) DEFAULT 'enterprise'");
                console.log('[DB] ✅ PostgreSQL campaigns table migrated (added target_scope).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL campaigns table migration failed (target_scope):', e.message);
            }

            // Migration path: Add target_areas column to campaigns table if not exists
            try {
                await pool.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_areas TEXT");
                console.log('[DB] ✅ PostgreSQL campaigns table migrated (added target_areas).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL campaigns table migration failed (target_areas):', e.message);
            }

            // Migration path: Add target_orgs column to campaigns table if not exists
            try {
                await pool.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_orgs TEXT");
                console.log('[DB] ✅ PostgreSQL campaigns table migrated (added target_orgs).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL campaigns table migration failed (target_orgs):', e.message);
            }

            // Migration path: Add prefecture column to stores table if not exists
            try {
                await pool.query("ALTER TABLE stores ADD COLUMN IF NOT EXISTS prefecture VARCHAR(255)");
                console.log('[DB] ✅ PostgreSQL stores table migrated (added prefecture).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL stores table migration failed (prefecture):', e.message);
            }

            // Migration path: Add store_type column to stores table if not exists
            try {
                await pool.query("ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_type VARCHAR(255)");
                console.log('[DB] ✅ PostgreSQL stores table migrated (added store_type).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL stores table migration failed (store_type):', e.message);
            }

            // Migration path: Add target_prefectures column to campaigns table if not exists
            try {
                await pool.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_prefectures TEXT");
                console.log('[DB] ✅ PostgreSQL campaigns table migrated (added target_prefectures).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL campaigns table migration failed (target_prefectures):', e.message);
            }

            // Migration path: Add target_store_types column to campaigns table if not exists
            try {
                await pool.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_store_types TEXT");
                console.log('[DB] ✅ PostgreSQL campaigns table migrated (added target_store_types).');
            } catch (e) {
                console.error('[DB] ❌ PostgreSQL campaigns table migration failed (target_store_types):', e.message);
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
                        ad_id TEXT,
                        store_id TEXT
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS stores (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        billing_email TEXT,
                        bank_name TEXT,
                        branch_name TEXT,
                        account_number TEXT,
                        account_holder TEXT,
                        bank_email TEXT,
                        area TEXT,
                        prefecture TEXT,
                        store_type TEXT,
                        total_pos_sales REAL DEFAULT 0.0,
                        total_ad_revenue REAL DEFAULT 0.0,
                        monthly_operating_cost REAL DEFAULT 0.0,
                        monthly_labor_cost REAL DEFAULT 0.0,
                        monthly_adsense_revenue REAL DEFAULT 0.0
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS campaigns (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        start_date TEXT,
                        end_date TEXT,
                        budget REAL DEFAULT 0.0,
                        spend REAL DEFAULT 0.0,
                        impressions INTEGER DEFAULT 0,
                        status TEXT DEFAULT 'pending',
                        advertiser TEXT,
                        target_org TEXT,
                        target_scope TEXT DEFAULT 'enterprise',
                        target_areas TEXT,
                        target_orgs TEXT,
                        target_prefectures TEXT,
                        target_store_types TEXT
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS pos_transactions (
                        id TEXT PRIMARY KEY,
                        company_name TEXT,
                        store_name TEXT,
                        total_amount REAL,
                        billing_email TEXT,
                        items TEXT,
                        status TEXT,
                        timestamp INTEGER
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS withdrawal_requests (
                        id TEXT PRIMARY KEY,
                        email TEXT NOT NULL,
                        amount REAL DEFAULT 0.0,
                        status TEXT DEFAULT 'Pending',
                        timestamp INTEGER,
                        details TEXT
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS creator_banks (
                        email TEXT PRIMARY KEY,
                        bank_name TEXT,
                        branch_name TEXT,
                        account_number TEXT,
                        account_holder TEXT,
                        id_base64 TEXT,
                        timestamp INTEGER
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS kyc_requests (
                        id TEXT PRIMARY KEY,
                        email TEXT NOT NULL,
                        org_name TEXT,
                        person_name TEXT,
                        corp_id TEXT,
                        duns TEXT,
                        documents TEXT,
                        ai_score INTEGER,
                        ai_details TEXT,
                        timestamp INTEGER,
                        status TEXT DEFAULT 'pending'
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS agency_referrals (
                        advertise_email TEXT PRIMARY KEY,
                        agency_email TEXT NOT NULL,
                        price REAL DEFAULT 0.0,
                        status TEXT DEFAULT 'Pending',
                        date TEXT
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS signage_states (
                        store_id TEXT PRIMARY KEY,
                        state_json TEXT
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS scheduled_broadcasts (
                        id TEXT PRIMARY KEY,
                        title TEXT,
                        text TEXT,
                        audio_url TEXT,
                        schedule_time TEXT,
                        target_store_id TEXT,
                        advertiser TEXT,
                        status TEXT DEFAULT 'pending'
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS account_strikes (
                        email TEXT PRIMARY KEY,
                        strikes INTEGER DEFAULT 0
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS admin_settings (
                        key TEXT PRIMARY KEY,
                        value TEXT
                    )
                `);

                sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS local_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        store_id TEXT NOT NULL,
                        event_name TEXT NOT NULL,
                        event_date TEXT,
                        description TEXT
                    )
                `);

                // Migration: Add store_id column to face_sensor_logs for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(face_sensor_logs)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error:', err.message);
                        return;
                    }
                    const hasStoreId = rows && rows.some(row => row.name === 'store_id');
                    if (!hasStoreId) {
                        sqliteDb.run("ALTER TABLE face_sensor_logs ADD COLUMN store_id TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE face_sensor_logs error:', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ face_sensor_logs.store_id column added successfully.');
                            }
                        });
                    }
                });

                // SQLite Migration: Add advertiser column to campaigns for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(campaigns)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error:', err.message);
                        return;
                    }
                    const hasAdvertiser = rows && rows.some(row => row.name === 'advertiser');
                    if (!hasAdvertiser) {
                        sqliteDb.run("ALTER TABLE campaigns ADD COLUMN advertiser TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE campaigns error:', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ campaigns.advertiser column added successfully.');
                            }
                        });
                    }
                });
                // SQLite Migration: Add target_org column to campaigns for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(campaigns)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error:', err.message);
                        return;
                    }
                    const hasTargetOrg = rows && rows.some(row => row.name === 'target_org');
                    if (!hasTargetOrg) {
                        sqliteDb.run("ALTER TABLE campaigns ADD COLUMN target_org TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE campaigns error (target_org):', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ campaigns.target_org column added successfully.');
                            }
                        });
                    }
                });
                sqliteDb.all("PRAGMA table_info(face_sensor_logs)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error:', err.message);
                        return;
                    }
                    const hasStoreId = rows && rows.some(row => row.name === 'store_id');
                    if (!hasStoreId) {
                        sqliteDb.run("ALTER TABLE face_sensor_logs ADD COLUMN store_id TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE face_sensor_logs error:', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ face_sensor_logs.store_id column added successfully.');
                            }
                        });
                    }
                });

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

                sqliteDb.get("SELECT COUNT(*) as count FROM local_events", (err, row) => {
                    if (row && row.count === 0) {
                        const defaultEvents = [
                            ['STORE_001', '近隣小学校の運動会', '2026/06/25', '近隣の小学校で運動会が開催されます。お弁当の需要が高まります。'],
                            ['STORE_001', '地域住民スポーツフェスティバル', '2026/06/28', '地域のスポーツ大会。ドリンクや軽食の需要があります。'],
                            ['STORE_001', '駅前商店街の夕市セール', '2026/06/30', '商店街合同の夕方タイムセールです。']
                        ];
                        const stmt = sqliteDb.prepare("INSERT INTO local_events (store_id, event_name, event_date, description) VALUES (?, ?, ?, ?)");
                        defaultEvents.forEach(ev => stmt.run(ev));
                        stmt.finalize();
                        console.log('[Database] ✅ SQLite 初期ローカルイベントの登録が完了しました。');
                    }
                });

                // SQLite Migration: Normalize advertiser/agency/creator/retailer roles to store role (DEPRECATED - Roles are now preserved)

                // Migration: Add bank_email column to stores for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(stores)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error for stores:', err.message);
                        return;
                    }
                    const hasBankEmail = rows && rows.some(row => row.name === 'bank_email');
                    if (!hasBankEmail) {
                        sqliteDb.run("ALTER TABLE stores ADD COLUMN bank_email TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE stores error (bank_email):', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ stores.bank_email column added successfully.');
                            }
                        });
                    }
                });

                // Migration: Add area column to stores for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(stores)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error for stores:', err.message);
                        return;
                    }
                    const hasArea = rows && rows.some(row => row.name === 'area');
                    if (!hasArea) {
                        sqliteDb.run("ALTER TABLE stores ADD COLUMN area TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE stores error (area):', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ stores.area column added successfully.');
                            }
                        });
                    }
                });

                // Migration: Add target_scope column to campaigns for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(campaigns)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error for campaigns:', err.message);
                        return;
                    }
                    const hasTargetScope = rows && rows.some(row => row.name === 'target_scope');
                    if (!hasTargetScope) {
                        sqliteDb.run("ALTER TABLE campaigns ADD COLUMN target_scope TEXT DEFAULT 'enterprise'", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE campaigns error (target_scope):', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ campaigns.target_scope column added successfully.');
                            }
                        });
                    }
                });

                // Migration: Add target_areas column to campaigns for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(campaigns)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error for campaigns:', err.message);
                        return;
                    }
                    const hasTargetAreas = rows && rows.some(row => row.name === 'target_areas');
                    if (!hasTargetAreas) {
                        sqliteDb.run("ALTER TABLE campaigns ADD COLUMN target_areas TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE campaigns error (target_areas):', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ campaigns.target_areas column added successfully.');
                            }
                        });
                    }
                });

                // Migration: Add target_orgs column to campaigns for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(campaigns)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error for campaigns:', err.message);
                        return;
                    }
                    const hasTargetOrgs = rows && rows.some(row => row.name === 'target_orgs');
                    if (!hasTargetOrgs) {
                        sqliteDb.run("ALTER TABLE campaigns ADD COLUMN target_orgs TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE campaigns error (target_orgs):', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ campaigns.target_orgs column added successfully.');
                            }
                        });
                    }
                });

                // Migration: Add prefecture column to stores for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(stores)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error for stores:', err.message);
                        return;
                    }
                    const hasPrefecture = rows && rows.some(row => row.name === 'prefecture');
                    if (!hasPrefecture) {
                        sqliteDb.run("ALTER TABLE stores ADD COLUMN prefecture TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE stores error (prefecture):', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ stores.prefecture column added successfully.');
                            }
                        });
                    }
                });

                // Migration: Add store_type column to stores for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(stores)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error for stores:', err.message);
                        return;
                    }
                    const hasStoreType = rows && rows.some(row => row.name === 'store_type');
                    if (!hasStoreType) {
                        sqliteDb.run("ALTER TABLE stores ADD COLUMN store_type TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE stores error (store_type):', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ stores.store_type column added successfully.');
                            }
                        });
                    }
                });

                // Migration: Add target_prefectures column to campaigns for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(campaigns)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error for campaigns:', err.message);
                        return;
                    }
                    const hasTargetPrefectures = rows && rows.some(row => row.name === 'target_prefectures');
                    if (!hasTargetPrefectures) {
                        sqliteDb.run("ALTER TABLE campaigns ADD COLUMN target_prefectures TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE campaigns error (target_prefectures):', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ campaigns.target_prefectures column added successfully.');
                            }
                        });
                    }
                });

                // Migration: Add target_store_types column to campaigns for SQLite if not exists
                sqliteDb.all("PRAGMA table_info(campaigns)", (err, rows) => {
                    if (err) {
                        console.error('[SQLite] PRAGMA table_info error for campaigns:', err.message);
                        return;
                    }
                    const hasTargetStoreTypes = rows && rows.some(row => row.name === 'target_store_types');
                    if (!hasTargetStoreTypes) {
                        sqliteDb.run("ALTER TABLE campaigns ADD COLUMN target_store_types TEXT", (alterErr) => {
                            if (alterErr) {
                                console.error('[SQLite] ALTER TABLE campaigns error (target_store_types):', alterErr.message);
                            } else {
                                console.log('[SQLite] ✅ campaigns.target_store_types column added successfully.');
                            }
                        });
                    }
                });

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
