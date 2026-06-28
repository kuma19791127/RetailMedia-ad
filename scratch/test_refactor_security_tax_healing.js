/**
 * Security role, freee tax discrepancy adjustment, and OAuth self-healing refactor tests.
 */
process.env.TOKEN_ENCRYPTION_KEY = "dummy_token_key_for_testing_1234567890";
const assert = require('assert');
const path = require('path');

// Mock express response/next helper
function createMockResNext() {
    let statusVal = 200;
    let jsonVal = null;
    let nextCalled = false;
    return {
        res: {
            status(s) {
                statusVal = s;
                return this;
            },
            json(j) {
                jsonVal = j;
                return this;
            }
        },
        next: function() {
            nextCalled = true;
        },
        getStatus() { return statusVal; },
        getJson() { return jsonVal; },
        isNextCalled() { return nextCalled; }
    };
}

async function runTests() {
    console.log("=== STARTING REFACTOR SECURITY, TAX & HEALING TESTS ===");

    // 1. Test requireRole Middleware
    console.log("\n[TEST 1] Testing requireRole Middleware...");
    const { requireRole } = require('../server_retail_dist.js');
    assert.strictEqual(typeof requireRole, 'function', 'requireRole middleware must be exported or defined');

    const middleware = requireRole(['creator', 'admin']);
    
    // 1a. Success case
    const mockReq1 = { user: { email: 'creator@example.com', role: 'creator' } };
    const { res: mockRes1, next: mockNext1, getStatus: getStatus1, isNextCalled: isNextCalled1 } = createMockResNext();
    middleware(mockReq1, mockRes1, mockNext1);
    assert.strictEqual(isNextCalled1(), true, 'Should call next() for authorized role');
    assert.strictEqual(getStatus1(), 200, 'Should not modify status code on success');

    // 1b. Forbidden case
    const mockReq2 = { user: { email: 'retailer@example.com', role: 'retailer' } };
    const { res: mockRes2, next: mockNext2, getStatus: getStatus2, getJson: getJson2 } = createMockResNext();
    middleware(mockReq2, mockRes2, mockNext2);
    console.log("[DEBUG TEST 1b] status:", getStatus2(), "json:", getJson2());
    assert.strictEqual(getStatus2(), 403, 'Should return 403 Forbidden for unauthorized role');
    assert.ok(getJson2() && getJson2().error && getJson2().error.includes('Forbidden'), 'Should contain access error message');

    console.log("-> TEST 1 PASSED: requireRole middleware protects paths securely!");


    // 2. Test freee Multi-Tax Sum Adjustment
    console.log("\n[TEST 2] Testing freee Multi-Tax Sum Adjustment...");
    const { createPayoutEntry } = require('../freee_api.js');
    assert.strictEqual(typeof createPayoutEntry, 'function', 'createPayoutEntry should be exported');

    const mockCompanyId = 12345;
    let sentPayload = null;

    // Stub global.fetch to intercept freee API calls
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
        console.log(`[TEST fetch MOCK] URL: ${url}, Method: ${options.method || 'GET'}`);
        
        // Mock getCompanies
        if (url.includes('/companies')) {
            return {
                ok: true,
                status: 200,
                text: async () => JSON.stringify({ companies: [{ display_name: "non-logi", id: mockCompanyId }] })
            };
        }
        // Mock getAccountItems
        if (url.includes('/account_items')) {
            return {
                ok: true,
                status: 200,
                text: async () => JSON.stringify({
                    account_items: [
                        { name: "外注費", id: 101 },
                        { name: "テスト用非課税項目", id: 999 }
                    ]
                })
            };
        }
        // Mock getWalletables
        if (url.includes('/walletables')) {
            return {
                ok: true,
                status: 200,
                text: async () => JSON.stringify({
                    walletables: [
                        { name: "GMOあおぞらネット銀行", id: 888, type: "bank_account" }
                    ]
                })
            };
        }
        // Mock getDeals (Idempotency check / creation)
        if (url.includes('/deals')) {
            if (options.method === 'POST') {
                sentPayload = JSON.parse(options.body);
                return {
                    ok: true,
                    status: 201,
                    text: async () => JSON.stringify({ deal: { id: 777 } })
                };
            }
            // GET deals (idempotency search)
            return {
                ok: true,
                status: 200,
                text: async () => JSON.stringify({ deals: [] })
            };
        }
        
        return {
            ok: false,
            status: 404,
            text: async () => "{}"
        };
    };

    try {
        await createPayoutEntry(mockCompanyId, {
            amount: 1000,
            date: '2026-06-28',
            paymentAmount: 1001, // sum = 1000 (diff = 1)
            accountItemId: 101,
            feeAmount: 0,
            feeItemId: 999, // mismatch to force else branch
            isReversal: false,
            description: 'Test Adjust'
        });

        assert.ok(sentPayload, "API post request should have been made");
        const details = sentPayload.details;
        assert.strictEqual(details.length, 2, "Should append a second detail row for non-taxable adjustment");
        assert.strictEqual(details[1].amount, 1, "Adjustment amount should be exactly 1 JPY");
        assert.strictEqual(details[1].tax_code, 0, "Adjustment row must be tax exempt (tax_code: 0)");
        assert.strictEqual(details[1].description, "[端数自動調整分] 消費税端数による金額ズレの非課税調整");
        console.log("-> TEST 2 PASSED: 1 JPY discrepancy is resolved by appending a non-taxable adjustment line!");
    } finally {
        global.fetch = originalFetch;
    }


    // 3. Test freee invalid_grant Self-Healing
    console.log("\n[TEST 3] Testing freee invalid_grant Self-Healing...");
    const { executeFreeeApiCall } = require('../server_retail_dist.js');
    assert.strictEqual(typeof executeFreeeApiCall, 'function', 'executeFreeeApiCall should be defined');

    // Mock invalid_grant failure
    const badApiCall = async () => {
        throw new Error("401 Unauthorized - Access token expired");
    };

    // Mock refreshFreeeToken to throw invalid_grant
    const originalRefresh = global.refreshFreeeToken;
    
    global.refreshFreeeToken = async () => {
        throw new Error("invalid_grant: Refresh token has expired");
    };

    const logs = [];
    const logCallback = (msg) => logs.push(msg);

    const dbHelper = require('../db_connector');
    // Pre-insert a dummy token to test deletion
    await dbHelper.query.run("INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('freee_access_token', 'dummy_acc')");
    await dbHelper.query.run("INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('freee_refresh_token', 'dummy_ref')");

    const recoveryResult = await executeFreeeApiCall(badApiCall, logCallback);
    
    // Query database to ensure token was deleted by the self-healing routine
    const tokenRow = await dbHelper.query.get("SELECT COUNT(*) as count FROM admin_settings WHERE key IN ('freee_access_token', 'freee_refresh_token')");
    const tokenCount = tokenRow ? (tokenRow.count || tokenRow['COUNT(*)'] || 0) : 0;
    assert.strictEqual(tokenCount, 0, "deleteFreeeTokenFromDB should clear freee_tokens record in admin_settings");
    
    assert.ok(recoveryResult.success, "Should return dynamic mock response to prevent queue lockup");
    assert.ok(recoveryResult.bypassed, "Result must indicate it bypassed the call");
    assert.ok(logs.some(l => l.includes("Activating emergency mock bypass")), "Should log self-healing bypass");

    console.log("-> TEST 3 PASSED: invalid_grant is successfully recovered via self-healing bypass and alert trigger!");

    console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
