import re
import os

db_path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\db_connector.js"

with open(db_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. initDB start replacement
target_start = """    // 起動時にテーブルを自動作成
    const initDB = async () => {
        try {
            // ロックタイムアウトを5秒に設定して、旧コンテナとのテーブルロック競合による起動デッドロックを防止
            await pool.query("SET lock_timeout = 5000");"""

replacement_start = """    // 起動時にテーブルを自動作成
    const initDB = async () => {
        let client = null;
        try {
            client = await pool.connect();
            // ロックタイムアウトを5秒に設定して、旧コンテナとのテーブルロック競合による起動デッドロックを防止
            await client.query("SET lock_timeout = 5000");"""

# Normalize newlines for match
content_norm = content.replace("\r\n", "\n")
target_start_norm = target_start.replace("\r\n", "\n")
replacement_start_norm = replacement_start.replace("\r\n", "\n")

if target_start_norm in content_norm:
    content_norm = content_norm.replace(target_start_norm, replacement_start_norm)
    print("Successfully replaced initDB start.")
else:
    print("Warning: target_start not found.")

# 2. Inside initDB, replace pool.query with client.query
# Let's locate the range of initDB in the norm content
init_db_func_start = content_norm.find("const initDB = async () => {")
if init_db_func_start != -1:
    # Find the next initDB(); call which marks the end of initDB definition block
    init_db_func_end = content_norm.find("initDB();", init_db_func_start)
    if init_db_func_end != -1:
        init_db_start_idx = init_db_func_start
        init_db_block = content_norm[init_db_start_idx : init_db_func_end]
        # Replace pool.query with client.query within this block only
        modified_block = init_db_block.replace("pool.query", "client.query")
        modified_block = modified_block.replace("await pool.query", "await client.query")
        content_norm = content_norm[:init_db_start_idx] + modified_block + content_norm[init_db_func_end:]
        print("Successfully replaced pool.query with client.query inside initDB.")
    else:
        print("Warning: initDB(); end call not found.")
else:
    print("Warning: initDB function declaration not found.")

# 3. initDB end replacement
target_end = """            console.log('[DB] ✅ PostgreSQLのテーブル初期化が完了しました。');
        } catch (e) {
            console.error('[DB] ❌ テーブル作成エラー:', e);
        }
    };
    initDB();"""

replacement_end = """            console.log('[DB] ✅ PostgreSQLのテーブル初期化が完了しました。');
        } catch (e) {
            console.error('[DB] ❌ テーブル作成・移行エラー (起動は続行します):', e);
        } finally {
            if (client) {
                try {
                    client.release();
                    console.log('[DB] PostgreSQL client released back to pool.');
                } catch (releaseErr) {
                    console.error('[DB] Failed to release client:', releaseErr);
                }
            }
        }
    };
    initDB();"""

target_end_norm = target_end.replace("\r\n", "\n")
replacement_end_norm = replacement_end.replace("\r\n", "\n")

if target_end_norm in content_norm:
    content_norm = content_norm.replace(target_end_norm, replacement_end_norm)
    print("Successfully replaced initDB end.")
else:
    print("Warning: target_end not found.")

# Write back with native CRLF/LF preservation
with open(db_path, "w", encoding="utf-8") as f:
    f.write(content_norm.replace("\n", "\r\n" if "\r\n" in content else "\n"))

print("Patch complete.")
