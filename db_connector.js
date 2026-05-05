const { Pool } = require('pg');

let pool = null;

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
                    password VARCHAR(255),
                    role VARCHAR(50),
                    name VARCHAR(255),
                    org VARCHAR(255),
                    two_factor_secret VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS transactions (
                    id SERIAL PRIMARY KEY,
                    transaction_id VARCHAR(255) UNIQUE,
                    amount INT,
                    store_id VARCHAR(255),
                    items JSONB,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS campaigns (
                    id VARCHAR(255) PRIMARY KEY,
                    url VARCHAR(1000),
                    youtube_url VARCHAR(1000),
                    advertiser VARCHAR(255),
                    budget INT,
                    daily_limit INT,
                    spent INT DEFAULT 0,
                    target_stores JSONB,
                    status VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('[DB] ✅ PostgreSQLのテーブル初期化が完了しました。');
        } catch (e) {
            console.error('[DB] ❌ テーブル作成エラー:', e);
        }
    };
    initDB();
} else {
    console.log('[DB] ⚠️ DATABASE_URL が未設定です。一時的なメモリモードで稼働します。');
}

module.exports = pool;
