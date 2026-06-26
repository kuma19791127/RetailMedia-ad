const { spawn } = require('child_process');
const assert = require('assert');
const speakeasy = require('speakeasy');

const API_BASE = 'http://127.0.0.1:3000';

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runIntegrationTests() {
    console.log("=== GMO Bank API Integration Tests ===");

    // 1. Start Server with GMO environment variables
    console.log("Starting server_retail_dist.js...");
    const server = spawn('node', ['server_retail_dist.js'], {
        cwd: __dirname + '/..',
        env: {
            ...process.env,
            PORT: '3000',
            GMO_API_KEY: 'gmo_test_api_key_12345',
            GMO_ACCOUNT_ID: 'gmo_test_account_id_67890'
        }
    });

    server.stdout.on('data', (data) => {
        console.log(`[Server] ${data}`);
    });

    server.stderr.on('data', (data) => {
        console.error(`[Server Error] ${data}`);
    });

    // Wait for server to start
    await wait(5000);

    let token = '';
    let secret = '';

    try {
        // 2. Login as admin
        console.log("Logging in as admin...");
        let loginRes = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@demo.com',
                password: 'demo1234!!',
                role: 'admin'
            })
        });

        assert.strictEqual(loginRes.status, 200, "Login status should be 200");
        let loginData = await loginRes.json();
        console.log("Initial Login Response:", loginData);

        // If 2FA is already set up, reset it first to ensure a clean slate
        if (loginData.require2FA) {
            console.log("2FA already setup. Resetting 2FA for a clean test state...");
            const resetRes = await fetch(`${API_BASE}/api/auth/reset-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'admin@demo.com',
                    password: 'demo1234!!',
                    role: 'admin'
                })
            });
            const resetData = await resetRes.json();
            assert.ok(resetData.success, "Reset 2FA should be successful");
            console.log("✓ 2FA Reset successful.");

            // Relogin to trigger 2FA Setup
            loginRes = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'admin@demo.com',
                    password: 'demo1234!!',
                    role: 'admin'
                })
            });
            loginData = await loginRes.json();
            console.log("Login after reset Response:", loginData);
        }

        // 2FA Setup Flow
        if (loginData.require2FASetup) {
            console.log("2FA Setup required. Setting up...");
            const setupRes = await fetch(`${API_BASE}/api/auth/2fa/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'admin@demo.com', role: 'admin' })
            });
            const setupData = await setupRes.json();
            secret = setupData.secret;
            assert.ok(secret, "Secret should be returned from 2FA setup");

            const totpToken = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });

            const enableRes = await fetch(`${API_BASE}/api/auth/2fa/enable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'admin@demo.com',
                    token: totpToken,
                    secret: secret,
                    role: 'admin'
                })
            });
            const enableData = await enableRes.json();
            assert.ok(enableData.success, "2FA enable should be successful");
            console.log("✓ 2FA successfully enabled.");

            // Login again
            const loginRes2 = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'admin@demo.com',
                    password: 'demo1234!!',
                    role: 'admin'
                })
            });
            const loginData2 = await loginRes2.json();
            console.log("Final login Response:", loginData2);
            
            if (loginData2.require2FA) {
                console.log("2FA Verification required after setup. Verifying...");
                const verifyToken = speakeasy.totp({
                    secret: secret,
                    encoding: 'base32'
                });
                const verifyRes = await fetch(`${API_BASE}/api/auth/2fa/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'admin@demo.com',
                        token: verifyToken,
                        role: 'admin'
                    })
                });
                const verifyData = await verifyRes.json();
                console.log("2FA Verify Response:", verifyData);
                assert.ok(verifyData.success, "2FA verification should be successful");
                token = verifyData.token;
            } else {
                assert.ok(loginData2.success, "Login should succeed now");
                token = loginData2.token;
            }
        } else {
            token = loginData.token;
        }

        assert.ok(token, "Token should be returned");
        console.log("✓ Login successful.");

        // 3. Test GET /api/bank/accounts
        console.log("Testing GET /api/bank/accounts...");
        const accountsRes = await fetch(`${API_BASE}/api/bank/accounts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        assert.strictEqual(accountsRes.status, 200, "Accounts API status should be 200");
        const accountsData = await accountsRes.json();
        assert.ok(accountsData.accounts, "Accounts list should be present");
        console.log("✓ GET /api/bank/accounts passed.");

        // 4. Test GET /api/bank/balance
        console.log("Testing GET /api/bank/balance...");
        const balanceRes = await fetch(`${API_BASE}/api/bank/balance?accountId=101011234567`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        assert.strictEqual(balanceRes.status, 200, "Balance API status should be 200");
        const balanceData = await balanceRes.json();
        assert.ok(balanceData.balances, "Balances should be present");
        console.log("✓ GET /api/bank/balance passed.");

        // 5. Test GET /api/bank/deposits
        console.log("Testing GET /api/bank/deposits...");
        const depositsRes = await fetch(`${API_BASE}/api/bank/deposits?accountId=101011234567`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        assert.strictEqual(depositsRes.status, 200, "Deposits API status should be 200");
        const depositsData = await depositsRes.json();
        assert.ok(depositsData.paymentArrivals, "Deposits list should be present");
        console.log("✓ GET /api/bank/deposits passed.");

        // 6. Test POST /api/bank/transfer (Mock transfer)
        console.log("Testing POST /api/bank/transfer...");
        const transferRes = await fetch(`${API_BASE}/api/bank/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount: "250000", description: "Integration Test Transfer" })
        });
        assert.strictEqual(transferRes.status, 200, "Transfer API status should be 200");
        const transferData = await transferRes.json();
        assert.strictEqual(transferData.status, "ACCEPTED", "Transfer should be ACCEPTED");
        console.log("✓ POST /api/bank/transfer passed.");

        // 7. Test POST /api/admin/payout/gmo-transfer (Admin payout execution)
        console.log("Testing POST /api/admin/payout/gmo-transfer...");
        const payoutTotpCode = speakeasy.totp({
            secret: secret,
            encoding: 'base32'
        });
        const payoutRes = await fetch(`${API_BASE}/api/admin/payout/gmo-transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: 'creator',
                targetIds: ['10001'],
                totpCode: payoutTotpCode
            })
        });
        assert.strictEqual(payoutRes.status, 200, "Payout API status should be 200");
        const payoutData = await payoutRes.json();
        assert.ok(payoutData.success, "Payout should be successful");
        assert.strictEqual(payoutData.message, "GMO銀行送金が完了し、支払状況を更新しました。", "Success message should match");
        console.log("✓ POST /api/admin/payout/gmo-transfer passed.");

        // 8. Test freee Queue Management APIs
        console.log("Testing GET /api/admin/freee/sync-queue...");
        const queueGetRes = await fetch(`${API_BASE}/api/admin/freee/sync-queue`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        assert.strictEqual(queueGetRes.status, 200, "Queue Get API status should be 200");
        const queueGetData = await queueGetRes.json();
        assert.ok(queueGetData.queue, "Queue list should be present");
        console.log(`✓ GET /api/admin/freee/sync-queue passed. Items: ${queueGetData.queue.length}`);

        if (queueGetData.queue.length > 0) {
            const firstTask = queueGetData.queue[0];
            console.log(`Testing POST /api/admin/freee/sync-queue/retry for task ${firstTask.id}...`);
            const retryRes = await fetch(`${API_BASE}/api/admin/freee/sync-queue/retry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id: firstTask.id })
            });
            assert.strictEqual(retryRes.status, 200, "Queue Retry API status should be 200");
            const retryData = await retryRes.json();
            assert.ok(retryData.success, "Retry should be successful");
            console.log("✓ POST /api/admin/freee/sync-queue/retry passed.");

            console.log(`Testing POST /api/admin/freee/sync-queue/clear for task ${firstTask.id}...`);
            const clearRes = await fetch(`${API_BASE}/api/admin/freee/sync-queue/clear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id: firstTask.id })
            });
            assert.strictEqual(clearRes.status, 200, "Queue Clear API status should be 200");
            const clearData = await clearRes.json();
            assert.ok(clearData.success, "Clear should be successful");
            console.log("✓ POST /api/admin/freee/sync-queue/clear passed.");
        }

        console.log("\n=== All GMO API Endpoint Integration Tests Passed! ===");
    } catch (e) {
        console.error("❌ Test Failed:", e);
        server.kill();
        process.exit(1);
    }

    // Kill Server
    console.log("Stopping server...");
    server.kill();
    process.exit(0);
}

runIntegrationTests();
