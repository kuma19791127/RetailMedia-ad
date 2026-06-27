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
/**
 * 振込依頼人名 (senderName) の標準化バリデータ (第40回監査対応)
 * 全銀フォーマット：半角カナ、大文字英数字、スペース、記号 ()-. のみに標準化し、最大40文字に切り詰める。
 */
function normalizeSenderName(name) {
    if (!name) return "";
    
    console.log(`[GMO Bank Validator] Original senderName: "${name}"`);

    // 全角英数字を半角に変換
    let normalized = name.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    // 全角カタカナを半角カタカナに変換するマッピング
    const kanaMap = {
        'ア': 'ｱ', 'イ': 'ｲ', 'ウ': 'ｳ', 'エ': 'ｴ', 'オ': 'ｵ',
        'カ': 'ｶ', 'キ': 'ｷ', 'ク': 'ｸ', 'ケ': 'ｹ', 'コ': 'ｺ',
        'サ': 'ｻ', 'シ': 'ｼ', 'ス': 'ｽ', 'セ': 'ｾ', 'ソ': 'ｿ',
        'タ': 'ﾀ', 'チ': 'ﾁ', 'ツ': 'ﾂ', 'テ': 'ﾃ', 'ト': 'ﾄ',
        'ナ': 'ﾅ', 'ニ': 'ﾆ', 'ヌ': 'ﾇ', 'ネ': 'ﾈ', 'ノ': 'ﾉ',
        'ハ': 'ﾊ', 'ヒ': 'ﾋ', 'フ': 'ﾌ', 'ヘ': 'ﾍ', 'ホ': 'ﾎ',
        'マ': 'ﾏ', 'ミ': 'ﾐ', 'ム': 'ﾑ', 'メ': 'ﾒ', 'モ': 'ﾓ',
        'ヤ': 'ﾔ', 'ユ': 'ﾕ', 'ヨ': 'ﾖ',
        'ラ': 'ﾗ', 'リ': 'ﾘ', 'ル': 'ﾙ', 'レ': 'ﾚ', 'ロ': 'ﾛ',
        'ワ': 'ﾜ', 'ヲ': 'ｦ', 'ン': 'ﾝ',
        'ァ': 'ｧ', 'ィ': 'ｨ', 'ゥ': 'ｳ', 'ェ': 'ｴ', 'ォ': 'ｵ',
        'ッ': 'ｯ', 'ャ': 'ｬ', 'ュ': 'ｭ', 'ョ': 'ｮ',
        'ガ': 'ｶﾞ', 'ギ': 'ｷﾞ', 'グ': 'ｸﾞ', 'ゲ': 'ｹﾞ', 'ゴ': 'ｺﾞ',
        'ザ': 'ｻﾞ', 'ジ': 'ｼﾞ', 'ズ': 'ｽﾞ', 'ゼ': 'ｾﾞ', 'ゾ': 'ｿﾞ',
        'ダ': 'ﾀﾞ', 'ヂ': 'ﾁﾞ', 'ヅ': 'ﾂﾞ', 'デ': 'ﾃﾞ', 'ド': 'ﾄﾞ',
        'バ': 'ﾊﾞ', 'ビ': 'ﾋﾞ', 'ブ': 'ﾌﾞ', 'ベ': 'ﾍﾞ', 'ボ': 'ﾎﾞ',
        'パ': 'ﾊﾟ', 'ピ': 'ﾋﾟ', 'プ': 'ﾌﾟ', 'ペ': 'ﾍﾟ', 'ポ': 'ﾎﾟ',
        'ヴ': 'ｳﾞ', 'ヷ': 'ﾜﾞ', 'ヺ': 'ｦﾞ',
        'ー': 'ｰ', '◌゙': 'ﾞ', '◌ﾟ': 'ﾟ', '　': ' '
    };
    
    let reg = new RegExp(Object.keys(kanaMap).join('|'), 'g');
    normalized = normalized.replace(reg, (match) => kanaMap[match] || match);

    // 大文字に統一
    normalized = normalized.toUpperCase();
    
    // 許可されていない文字を除去 (半角カナ \uFF61-\uFF9F、大文字英数字、スペース、記号 ()-./)
    normalized = normalized.replace(/[^A-Z0-9\(\)\-\.\/\s\uFF61-\uFF9F]/g, "");

    // 連続するスペースを1つに統合し、前後のスペースを削除
    normalized = normalized.replace(/\s+/g, " ").trim();

    // 最大40文字に切り詰め
    normalized = normalized.slice(0, 40);

    console.log(`[GMO Bank Validator] Normalized senderName: "${normalized}"`);
    return normalized;
}

/**
 * 4. 振込依頼 (Transfer Request / 総合振込)
 */
async function requestTransfer(transferData) {
    console.log("[GMO Bank Mock] requestTransfer called with data:", transferData);
    
    // 振込依頼人名の標準化と検証 (第40回監査対応)
    const senderName = transferData.senderName || "カ)リテアド";
    const cleanSenderName = normalizeSenderName(senderName);
    
    if (senderName && senderName.length > 0 && cleanSenderName.length === 0) {
        console.error(`[GMO Bank Mock Error] requestTransfer failed: senderName contains invalid characters only.`);
        throw new Error("振込依頼人名に使用できない文字のみが含まれています。半角カナ、英数字、スペース、記号()-.のみが使用可能です。");
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return dummy success response
    return {
        transactionId: "TRX" + Math.floor(Math.random() * 1000000000),
        status: "ACCEPTED",
        transferAmount: transferData.amount || "0",
        fee: "145",
        senderName: cleanSenderName,
        acceptedAt: new Date().toISOString()
    };
}

module.exports = {
    getAccounts,
    getBalance,
    getDepositTransactions,
    requestTransfer,
    normalizeSenderName // 外部からバリデーションとして再利用できるようにエクスポート
};
