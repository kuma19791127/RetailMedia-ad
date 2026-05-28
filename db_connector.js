const { Pool } = require('pg');

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
                    email VARCHAR(255) PRIMARY KEY,
                    password TEXT NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    name VARCHAR(255),
                    org VARCHAR(255),
                    two_factor_secret VARCHAR(255)
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
                    total_ad_revenue DOUBLE PRECISION DEFAULT 0.0
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

                CREATE TABLE IF NOT EXISTS products (
                    jan_code VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    price INT NOT NULL DEFAULT 0,
                    category VARCHAR(255)
                );
            `);

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
