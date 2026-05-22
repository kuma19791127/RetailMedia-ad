/**
 * GMO Aozora Net Bank - Mock API Module
 * This module simulates the behavior of the GMO Aozora Net Bank Open API.
 * It is used for development and testing until the actual API keys are approved.
 */

// Dummy Data
const DUMMY_ACCOUNTS = [
    {
        accountId: "101011234567",
        branchCode: "101",
        branchName: "法人第一支店",
        accountTypeCode: "01",
        accountTypeName: "普通預金",
        accountNumber: "1234567",
        accountName: "カ）リテアド",
        accountNameKana: "カ）リテアド",
        currencyCode: "JPY",
        currencyName: "日本円"
    }
];

const DUMMY_BALANCE = {
    accountId: "101011234567",
    balance: "5000000",
    withdrawableAmount: "5000000",
    previousDayBalance: "5000000",
    previousMonthBalance: "4500000"
};

const DUMMY_DEPOSIT_TRANSACTIONS = [
    {
        transactionDate: new Date().toISOString().split('T')[0],
        valueDate: new Date().toISOString().split('T')[0],
        transactionType: "2",
        amount: "50000",
        remarks: "カ）コウコクヌシ",
        itemKey: "20260522000001"
    },
    {
        transactionDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        valueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        transactionType: "2",
        amount: "100000",
        remarks: "カ）スーパーマーケット",
        itemKey: "20260521000001"
    }
];

/**
 * 1. 口座一覧照会 (Account List)
 */
async function getAccounts() {
    console.log("[GMO Bank Mock] getAccounts called");
    return {
        baseDate: new Date().toISOString().split('T')[0],
        baseTime: new Date().toISOString().split('T')[1].split('.')[0] + "+09:00",
        accounts: DUMMY_ACCOUNTS
    };
}

/**
 * 2. 残高照会 (Balance Inquiry)
 */
async function getBalance(accountId = "101011234567") {
    console.log(`[GMO Bank Mock] getBalance called for account: ${accountId}`);
    return {
        balances: [
            {
                ...DUMMY_ACCOUNTS[0],
                ...DUMMY_BALANCE
            }
        ]
    };
}

/**
 * 3. 振込入金明細照会 (Deposit Transactions)
 */
async function getDepositTransactions(accountId = "101011234567", dateFrom, dateTo) {
    console.log(`[GMO Bank Mock] getDepositTransactions called for account: ${accountId}, from: ${dateFrom}, to: ${dateTo}`);
    
    // In a real scenario, we would filter by dateFrom and dateTo.
    // For the mock, we just return the dummy transactions.
    return {
        accountId: accountId,
        dateFrom: dateFrom || new Date().toISOString().split('T')[0],
        dateTo: dateTo || new Date().toISOString().split('T')[0],
        baseDate: new Date().toISOString().split('T')[0],
        baseTime: new Date().toISOString().split('T')[1].split('.')[0] + "+09:00",
        hasNext: false,
        nextItemKey: "",
        count: DUMMY_DEPOSIT_TRANSACTIONS.length.toString(),
        paymentArrivals: DUMMY_DEPOSIT_TRANSACTIONS
    };
}

/**
 * 4. 振込依頼 (Transfer Request / 総合振込)
 */
async function requestTransfer(transferData) {
    console.log("[GMO Bank Mock] requestTransfer called with data:", transferData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return dummy success response
    return {
        transactionId: "TRX" + Math.floor(Math.random() * 1000000000),
        status: "ACCEPTED",
        transferAmount: transferData.amount || "0",
        fee: "145",
        acceptedAt: new Date().toISOString()
    };
}

module.exports = {
    getAccounts,
    getBalance,
    getDepositTransactions,
    requestTransfer
};
