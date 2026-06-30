const assert = require('assert');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

async function runTest() {
    console.log("Starting test_pos_cancellation...");

    // Remove local retail_media.db first, BEFORE requiring db_connector!
    const dbPath = path.resolve(__dirname, '../retail_media.db');
    if (fs.existsSync(dbPath)) {
        try {
            fs.unlinkSync(dbPath);
            console.log("Deleted existing retail_media.db for schema fresh initialization.");
        } catch (e) {
            console.error("Failed to delete retail_media.db:", e.message);
        }
    }

    // Now load db_connector, which will initialize tables correctly on the fresh DB
    const dbHelper = require('../db_connector');

    // 1. Create a dummy test user for authentication
    const email = "store_test_cancellation@example.com";
    const plainPass = "TestPass123!";
    const hashedPassword = hashPassword(plainPass);
    const role = "store";

    // Wait until tables are initialized by trying to run query with retries
    console.log("Waiting for database tables to initialize...");
    let dbInitRetries = 20;
    while (dbInitRetries > 0) {
        try {
            await dbHelper.query.run('DELETE FROM users WHERE email = ? AND role = ?', [email, role]);
            await dbHelper.query.run('DELETE FROM stores WHERE id = ?', [email]);
            break;
        } catch (e) {
            dbInitRetries--;
            if (dbInitRetries === 0) {
                throw new Error("Database tables failed to initialize in time: " + e.message);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Insert test user (No 2FA by default, org = email)
    await dbHelper.query.run(
        'INSERT INTO users (email, password, role, org) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, role, email]
    );
    // Insert test store with initial POS sales = 250
    await dbHelper.query.run(
        "INSERT INTO stores (id, name, billing_email, area, prefecture, store_type, total_pos_sales) VALUES (?, ?, ?, '関東', '東京都', 'スーパーマーケット', 250.0)",
        [email, "Test Store", email]
    );
    console.log("Inserted test store user and store record with 250 initial sales.");

    const port = 5134;
    process.env.PORT = port;
    process.env.NODE_ENV = 'test';
    process.env.GEMINI_API_KEY = 'mock'; // prevent crash on init
    process.env.TOKEN_ENCRYPTION_KEY = 'mock_encryption_key_32_bytes_long_!';
    
    console.log(`Starting mock server on port ${port}...`);
    const serverProcess = exec(`node server_retail_dist.js`, { env: process.env });

    serverProcess.stdout.on('data', (data) => {
        // console.log(`[Server] ${data.trim()}`);
    });
    serverProcess.stderr.on('data', (data) => {
        console.error(`[Server Stderr] ${data.trim()}`);
    });

    console.log(`Waiting for server on port ${port}...`);
    let retries = 90;
    let serverReady = false;
    while (retries > 0) {
        try {
            await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: "test", password: "test", role: "store" })
            });
            serverReady = true;
            break;
        } catch (err) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    if (!serverReady) {
        throw new Error(`Server failed to start accepting connections on port ${port}.`);
    }
    console.log("Mock server started and ready.");

    const storeId = email;
    const transactionId = "TX_TEST_CANCELLATION_" + Date.now();

    try {
        // 1. Login to obtain token
        console.log("Logging in as test store user...");
        let res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: plainPass, role, clientType: 'manualhelp' }) // clientTypeを渡して2FAをバイパス
        });
        let loginData = await res.json();
        console.log("Login response:", loginData);
        assert.ok(loginData.success, "Login should succeed");
        const token = loginData.token;
        assert.ok(token, "Should receive JWT token");

        const authHeaders = {
            'Content-Type': 'application/json',
            'Cookie': `token=${token}`
        };

        // Verify database sales before cancellation directly from SQLite
        console.log("Verifying SQLite store sales before cancellation...");
        let storeState = await dbHelper.query.get('SELECT total_pos_sales FROM stores WHERE id = ?', [storeId]);
        console.log("DB Store state before:", storeState);
        assert.strictEqual(storeState.total_pos_sales, 250, "Sales should be 250");

        // 2. POST /api/pos/transaction
        console.log("Step 2: Creating a transaction...");
        const items = [
            { janCode: "4901234567890", name: "りんご", price: 150 },
            { janCode: "4901234567891", name: "みかん", price: 100 }
        ];
        res = await fetch(`http://127.0.0.1:${port}/api/pos/transaction`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                transaction_id: transactionId,
                store_id: storeId,
                total_amount: 250,
                items: items
            })
        });
        let data = await res.json();
        console.log("Transaction response:", data);
        assert.ok(data.success, "Transaction registration should succeed");

        // 3. POST /api/pos/cancel-request (PARTIAL)
        console.log("Step 3: Submitting partial cancel request for 'みかん' (¥100)...");
        res = await fetch(`http://127.0.0.1:${port}/api/pos/cancel-request`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                transaction_id: transactionId,
                store_id: storeId,
                type: "PARTIAL",
                items: [{ janCode: "4901234567891", name: "みかん", price: 100 }],
                amount: 100
            })
        });
        data = await res.json();
        console.log("Cancel request response:", data);
        assert.ok(data.success, "Cancel request should succeed");

        // 4. GET /api/pos/cancel-requests
        console.log("Step 4: Fetching cancel requests...");
        res = await fetch(`http://127.0.0.1:${port}/api/pos/cancel-requests?store_id=${storeId}`, {
            headers: authHeaders
        });
        data = await res.json();
        console.log("Cancel requests list:", data);
        assert.ok(data.success);
        assert.strictEqual(data.requests.length, 1);
        const reqObj = data.requests[0];
        assert.strictEqual(reqObj.transaction_id, transactionId);
        assert.strictEqual(reqObj.amount, 100);

        // Verify database sales after cancellation (Should be 250 - 100 = 150)
        console.log("Verifying SQLite store sales after cancellation...");
        storeState = await dbHelper.query.get('SELECT total_pos_sales FROM stores WHERE id = ?', [storeId]);
        console.log("DB Store state after auto cancellation:", storeState);
        assert.strictEqual(storeState.total_pos_sales, 150, "Store sales in DB should decrease to 150 immediately");

        console.log("✅ E2E Cancellation Flow Test passed successfully!");
    } catch (err) {
        console.error("❌ E2E Cancellation Flow Test failed:", err);
        process.exitCode = 1;
    } finally {
        // Cleanup test user & store
        try {
            await dbHelper.query.run('DELETE FROM users WHERE email = ? AND role = ?', [email, role]);
            await dbHelper.query.run('DELETE FROM stores WHERE id = ?', [email]);
            console.log("Cleaned up test user & store.");
        } catch (e) {
            console.error("Cleanup failed:", e);
        }
        if (serverProcess) {
            serverProcess.kill();
            console.log("Killed test server.");
        }
        setTimeout(() => {
            process.exit(process.exitCode || 0);
        }, 1000);
    }
}

runTest().catch(console.error);
