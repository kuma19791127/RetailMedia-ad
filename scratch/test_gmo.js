const assert = require('assert');
const gmoBankMock = require('../gmo_bank_mock');

async function runTests() {
    console.log("=== GMO Bank Mock Unit Tests ===");

    try {
        // 1. getAccounts
        console.log("Testing getAccounts...");
        const accountsResult = await gmoBankMock.getAccounts();
        assert.ok(accountsResult.accounts, "Should return accounts list");
        assert.strictEqual(accountsResult.accounts[0].accountId, "101011234567", "Account ID should match");
        console.log("✓ getAccounts passed.");

        // 2. getBalance
        console.log("Testing getBalance...");
        const balanceResult = await gmoBankMock.getBalance("101011234567");
        assert.ok(balanceResult.balances, "Should return balances list");
        assert.strictEqual(balanceResult.balances[0].balance, "5000000", "Balance should match");
        console.log("✓ getBalance passed.");

        // 3. getDepositTransactions
        console.log("Testing getDepositTransactions...");
        const depositsResult = await gmoBankMock.getDepositTransactions("101011234567", "2026-05-21", "2026-05-22");
        assert.ok(depositsResult.paymentArrivals, "Should return transactions list");
        assert.strictEqual(depositsResult.paymentArrivals.length, 2, "Should return 2 dummy transactions");
        console.log("✓ getDepositTransactions passed.");

        // 4. requestTransfer
        console.log("Testing requestTransfer...");
        const transferPayload = { amount: "250000", description: "Test transfer" };
        const transferResult = await gmoBankMock.requestTransfer(transferPayload);
        assert.strictEqual(transferResult.status, "ACCEPTED", "Transfer should be ACCEPTED");
        assert.strictEqual(transferResult.transferAmount, "250000", "Transfer amount should match");
        console.log("✓ requestTransfer passed.");

        console.log("\n=== All GMO Bank Mock Unit Tests Passed! ===");
    } catch (error) {
        console.error("❌ Test Failed:", error);
        process.exit(1);
    }
}

runTests();
