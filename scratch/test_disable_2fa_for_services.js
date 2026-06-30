const assert = require('assert');
const dbHelper = require('../db_connector');
const crypto = require('crypto');

// Helper to hash password exactly like server does
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

async function runTest() {
    console.log("Starting test_disable_2fa_for_services...");
    
    // 1. Create a dummy test user with 2FA enabled
    const email = "test2fa_bypass@example.com";
    const plainPass = "TestPass123!";
    const hashedPassword = hashPassword(plainPass);
    const role = "store";
    const twoFactorSecret = "JBSWY3DPEHPK3PXP"; // Dummy secret

    // Delete if existing
    await dbHelper.query.run('DELETE FROM users WHERE email = ? AND role = ?', [email, role]);
    
    // Insert test user with 2FA
    await dbHelper.query.run(
        'INSERT INTO users (email, password, role, two_factor_secret, org) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, role, twoFactorSecret, 'test_org_123']
    );

    console.log("Inserted test user with 2FA secret set.");

    // Import Express server module dynamically or use simulated fetch
    // To make it easy and standalone, we can directly mock the request/response logic or start the server.
    // However, it is easier to start the server on a random port or call the server's post handlers.
    // Let's import server_retail_dist or do a mock handler execution.
    // Instead of launching full express server, let's spin it up or verify the endpoint logic.
    // Wait, server_retail_dist.js starts the server automatically, which might bind to port 3000.
    // Let's see if we can start it by setting env PORT=4000 and running it.
    
    // Alternatively, we can mock the request/response objects and call the actual app handler.
    // Let's launch the server as a subprocess and make HTTP requests to it. That is the most realistic E2E test.
    
    const { exec } = require('child_process');
    const port = 5123;
    process.env.PORT = port;
    process.env.NODE_ENV = 'test';
    process.env.GEMINI_API_KEY = 'mock'; // prevent crash on init
    process.env.TOKEN_ENCRYPTION_KEY = 'mock_encryption_key_32_bytes_long_!';
    
    console.log(`Starting mock server on port ${port}...`);
    const serverProcess = exec(`node server_retail_dist.js`, { env: process.env });

    // Pipe outputs to help debugging
    serverProcess.stdout.on('data', (data) => {
        console.log(`[Server Stdout] ${data.trim()}`);
    });
    serverProcess.stderr.on('data', (data) => {
        console.error(`[Server Stderr] ${data.trim()}`);
    });

    console.log(`Mock server started. Waiting for server to accept connections on port ${port}...`);
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
        throw new Error(`Server failed to start accepting connections on port ${port} within timeout.`);
    }
    console.log("Mock server started and verified ready. Starting requests...");

    try {
        // Request 1: Without clientType -> Should require 2FA
        console.log("Request 1: No clientType (Should require 2FA)");
        let res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: plainPass, role })
        });
        let data = await res.json();
        console.log("Response 1:", data);
        assert.ok(data.success, "Login attempt should succeed");
        assert.ok(data.require2FA, "Should require 2FA verification when no clientType specified");

        // Request 2: With clientType='manualhelp' -> Should bypass 2FA
        console.log("Request 2: clientType='manualhelp' (Should bypass 2FA)");
        res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: plainPass, role, clientType: 'manualhelp' })
        });
        data = await res.json();
        console.log("Response 2:", data);
        assert.ok(data.success, "Login should succeed");
        assert.ok(!data.require2FA, "Should NOT require 2FA verification for manualhelp");
        assert.ok(data.token, "Should return session token directly");

        // Request 3: With clientType='shift_manager' -> Should bypass 2FA
        console.log("Request 3: clientType='shift_manager' (Should bypass 2FA)");
        res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: plainPass, role, clientType: 'shift_manager' })
        });
        data = await res.json();
        console.log("Response 3:", data);
        assert.ok(data.success, "Login should succeed");
        assert.ok(!data.require2FA, "Should NOT require 2FA verification for shift_manager");
        assert.ok(data.token, "Should return session token directly");

        console.log("✅ All tests passed successfully!");
    } catch (err) {
        console.error("❌ Test failed:", err);
        process.exitCode = 1;
    } finally {
        // Cleanup test user
        try {
            await dbHelper.query.run('DELETE FROM users WHERE email = ? AND role = ?', [email, role]);
            console.log("Cleaned up test user.");
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
