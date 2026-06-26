/**
 * freee API Integration Module
 * Handles automated bookkeeping and synchronization with freee Accounting.
 */

require('dotenv').config();
const FREEE_API_BASE = "https://api.freee.co.jp/api/1";

// 開発用テスト事業所 (Development Test Company)
// If you want to use the main company "non-logi", change this to 10685574
const DEFAULT_COMPANY_ID = 10685574; 

let activeAccessToken = process.env.FREEE_ACCESS_TOKEN || null;

// Dynamic setter for the access token to bypass circular dependency
function setAccessToken(token) {
    activeAccessToken = token;
    console.log("[freee API] Access token in API module updated. Length:", token ? token.length : 0);
}

// Helper to check what token to use (dynamic or static env)
function getAccessToken() {
    return activeAccessToken;
}

/**
 * Helper to make API requests to freee
 */
async function freeeRequest(endpoint, method = 'GET', data = null) {
    const url = `${FREEE_API_BASE}${endpoint}`;
    const token = getAccessToken();
    
    console.log(`[freee API Request] URL: ${url}, Method: ${method}, Token Length: ${token ? token.length : 0}, Token Substring: ${token ? token.substring(0, 8) + '...' : 'none'}`);
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    const options = {
        method,
        headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
        console.error(`[freee API Error] Response Code: ${response.status}, StatusText: ${response.statusText}`, responseData);
        let errorDetail = "";
        if (responseData && responseData.errors && Array.isArray(responseData.errors)) {
            errorDetail = " - " + responseData.errors.map(err => {
                if (err.messages && Array.isArray(err.messages)) {
                    return err.messages.join(", ");
                }
                return err.message || JSON.stringify(err);
            }).join("; ");
        } else if (responseData && responseData.message) {
            errorDetail = " - " + responseData.message;
        } else if (responseData) {
            errorDetail = " - " + JSON.stringify(responseData);
        }
        throw new Error(`freee API Error: ${response.status} ${response.statusText}${errorDetail}`);
    }

    return responseData;
}

/**
 * 1. 事業所一覧の取得 (Get Companies)
 */
async function getCompanies() {
    console.log("[freee API] Fetching companies...");
    return await freeeRequest('/companies');
}

/**
 * 2. 勘定科目一覧の取得 (Get Account Items)
 */
async function getAccountItems(companyId = DEFAULT_COMPANY_ID) {
    console.log(`[freee API] Fetching account items for company: ${companyId}`);
    return await freeeRequest(`/account_items?company_id=${companyId}`);
}

/**
 * 3. 売上の自動仕訳登録 (Create Sales Journal Entry / 取引)
 * This creates a deal (売上) in freee.
 */
async function createSalesEntry(companyId = undefined, salesData) {
    // 0. 動的に適切な事業所ID (companyId) を解決する
    let activeCompanyId = companyId;
    try {
        const companiesRes = await getCompanies();
        if (companiesRes && companiesRes.companies && companiesRes.companies.length > 0) {
            // "non-logi" の名前を含む事業所を最優先で探し、無ければ最初を使用する
            const matched = companiesRes.companies.find(c => 
                c.display_name && c.display_name.includes("non-logi")
            ) || companiesRes.companies.find(c => 
                c.name && c.name.includes("non-logi")
            );
            activeCompanyId = matched ? matched.id : companiesRes.companies[0].id;
            console.log("[freee API] Automatically resolved active company_id:", activeCompanyId);
        }
    } catch (err) {
        console.warn("[freee API] Failed to resolve company_id dynamically, using fallback:", err.message);
        activeCompanyId = activeCompanyId || DEFAULT_COMPANY_ID;
    }

    console.log(`[freee API] Creating sales entry for company: ${activeCompanyId}`);
    
    // Default dummy data if none provided
    const amount = salesData?.amount || 50000;
    const issueDate = salesData?.date || new Date().toISOString().split('T')[0];
    const description = salesData?.description || "どこでもレジ（Square）からの自動連携売上";

    // 1. 動的に「売上高」に相当する勘定科目のIDを探す
    let accountItemId = null;
    try {
        const itemsRes = await getAccountItems(activeCompanyId);
        if (itemsRes && itemsRes.account_items) {
            const matchItem = itemsRes.account_items.find(item => 
                item.name.includes("売上高") || 
                item.name.includes("売上") || 
                item.name.includes("雑収入")
            );
            if (matchItem) {
                accountItemId = matchItem.id;
                console.log("[freee API] Resolved account_item_id:", accountItemId);
            }
        }
    } catch (err) {
        console.warn("[freee API] Failed to resolve account item id dynamically:", err.message);
    }

    // 2. 動的に決済口座（銀行口座等）のIDを探す
    let walletableId = null;
    let walletableType = "bank_account";
    try {
        const walletablesRes = await freeeRequest(`/walletables?company_id=${activeCompanyId}`);
        if (walletablesRes && walletablesRes.walletables && walletablesRes.walletables.length > 0) {
            walletableId = walletablesRes.walletables[0].id;
            walletableType = walletablesRes.walletables[0].type; // bank_account, wallet, credit_card
            console.log("[freee API] Resolved walletable_id:", walletableId, "type:", walletableType);
        }
    } catch (err) {
        console.warn("[freee API] Failed to resolve walletable dynamically:", err.message);
    }

    // 3. 税区分（tax_code）の動的解決
    let taxCode = salesData?.taxCode;
    if (taxCode === undefined) {
        try {
            const dbHelper = require('./db_connector');
            const row = await dbHelper.query.get("SELECT value FROM admin_settings WHERE key = 'freee_default_income_tax_code'");
            if (row && row.value) {
                taxCode = parseInt(row.value, 10);
                console.log("[freee API] Resolved default income tax_code from database:", taxCode);
            }
        } catch (dbErr) {
            console.warn("[freee API] Failed to query default income tax_code from DB:", dbErr.message);
        }
    }
    if (taxCode === undefined) {
        taxCode = 1; // 最終フォールバック (課税売上10%)
    }

    // freee API expects a specific payload format for Deals (取引)
    const payload = {
        issue_date: issueDate,
        type: "income",      // income = 収入 (売上)
        company_id: activeCompanyId,
        details: [
            {
                tax_code: taxCode,
                account_item_id: accountItemId, // 動的に解決した勘定科目IDをセット
                amount: amount,
                description: description
            }
        ],
        payments: walletableId ? [
            {
                amount: amount,
                date: issueDate,
                from_walletable_type: walletableType,
                from_walletable_id: walletableId // 動的に解決した口座IDをセット
            }
        ] : [], // 口座が見つからない場合は未決済取引として登録する
        receipt_ids: []
    };

    try {
        const result = await freeeRequest('/deals', 'POST', payload);
        console.log("[freee API] Sales entry created successfully:", result);
        return result;
    } catch (e) {
        console.error("[freee API] Failed to create deal. Error details:", e.message);
        throw e; // エラーを上位に伝播させ、デモ用モックによるサイレント失敗を防ぐ
    }
}

/**
 * 4. 勘定科目の追加 (Create Account Item)
 */
async function createAccountItem(companyId, accountItemData) {
    console.log(`[freee API] Creating account item for company: ${companyId}`);
    const payload = {
        company_id: companyId,
        account_item: {
            name: accountItemData.name,
            account_category_id: accountItemData.account_category_id,
            tax_code: accountItemData.tax_code || 1, // デフォルト: 課税売上10%
            corresponding_expense_id: accountItemData.corresponding_expense_id !== undefined ? accountItemData.corresponding_expense_id : null,
            corresponding_income_id: accountItemData.corresponding_income_id !== undefined ? accountItemData.corresponding_income_id : null,
            group_name: accountItemData.group_name !== undefined ? accountItemData.group_name : null
        }
    };
    return await freeeRequest('/account_items', 'POST', payload);
}

/**
 * 5. 勘定科目の変更 (Update Account Item)
 */
async function updateAccountItem(companyId, accountItemId, accountItemData) {
    console.log(`[freee API] Updating account item ${accountItemId} for company: ${companyId}`);
    const payload = {
        company_id: companyId,
        account_item: {
            name: accountItemData.name,
            corresponding_expense_id: accountItemData.corresponding_expense_id !== undefined ? accountItemData.corresponding_expense_id : null,
            corresponding_income_id: accountItemData.corresponding_income_id !== undefined ? accountItemData.corresponding_income_id : null,
            group_name: accountItemData.group_name !== undefined ? accountItemData.group_name : null
        }
    };
    return await freeeRequest(`/account_items/${accountItemId}`, 'PUT', payload);
}

/**
 * 6. 勘定科目の削除 (Delete Account Item)
 */
async function deleteAccountItem(companyId, accountItemId) {
    console.log(`[freee API] Deleting account item ${accountItemId} for company: ${companyId}`);
    return await freeeRequest(`/account_items/${accountItemId}?company_id=${companyId}`, 'DELETE');
}

/**
 * 7. 事業所情報の更新 (Update Company)
 */
async function updateCompany(companyId, companyData) {
    console.log(`[freee API] Updating company information for company: ${companyId}`);
    const payload = {
        name: companyData.name,
        display_name: companyData.display_name
    };
    return await freeeRequest(`/companies/${companyId}`, 'PUT', payload);
}

/**
 * 8. 取引の参照 (Get Deals)
 */
async function getDeals(companyId, params = {}) {
    console.log(`[freee API] Fetching deals for company: ${companyId}`);
    let query = `?company_id=${companyId}`;
    if (params.limit) query += `&limit=${params.limit}`;
    return await freeeRequest(`/deals${query}`, 'GET');
}

/**
 * 9. 支出（報酬・経費）の自動仕訳登録 (Create Expense Journal Entry / 取引)
 * This creates a deal (支出) in freee for payouts.
 */
async function createPayoutEntry(companyId = undefined, payoutData) {
    let activeCompanyId = companyId;

    // 1. もし引数で指定されていなければ、DB (admin_settings) から明示的に設定されたIDを読み込む
    if (!activeCompanyId) {
        try {
            const dbHelper = require('./db_connector');
            const row = await dbHelper.query.get("SELECT value FROM admin_settings WHERE key = 'freee_company_id'");
            if (row && row.value) {
                activeCompanyId = parseInt(row.value, 10);
                console.log("[freee API] Resolved explicit company_id from database:", activeCompanyId);
            }
        } catch (dbErr) {
            console.warn("[freee API] Failed to query freee_company_id from DB:", dbErr.message);
        }
    }

    // 2. それでも解決できない場合のみ、freee API から所属事業所リストを取得して自動解決を試みる
    if (!activeCompanyId) {
        try {
            const companiesRes = await getCompanies();
            if (companiesRes && companiesRes.companies && companiesRes.companies.length > 0) {
                const matched = companiesRes.companies.find(c => 
                    c.display_name && c.display_name.includes("non-logi")
                ) || companiesRes.companies.find(c => 
                    c.name && c.name.includes("non-logi")
                );
                activeCompanyId = matched ? matched.id : companiesRes.companies[0].id;
                console.log("[freee API] Automatically resolved active company_id for payout:", activeCompanyId);
            }
        } catch (err) {
            console.warn("[freee API] Failed to resolve company_id dynamically for payout, using fallback:", err.message);
            activeCompanyId = DEFAULT_COMPANY_ID;
        }
    }

    console.log(`[freee API] Creating payout entry for company: ${activeCompanyId}`);

    const amount = payoutData?.amount || 0;
    const payoutType = payoutData?.payoutType || 'store'; // 'store', 'creator', 'agency'
    const targetId = payoutData?.targetId || 'unknown';
    const issueDate = payoutData?.date || new Date().toISOString().split('T')[0];
    
    let description = `GMO銀行振込完了に伴う自動連動仕訳 (${payoutType === 'creator' ? 'クリエイター報酬' : payoutType === 'agency' ? '代理店紹介料' : '店舗広告収益分配'}) - ID: ${targetId}`;

    // 1. 動的に適切な勘定科目のIDを探す
    // クリエイター/店舗/代理店は「支払手数料」または「外注費」にマッピング
    let accountItemId = null;
    try {
        const itemsRes = await getAccountItems(activeCompanyId);
        if (itemsRes && itemsRes.account_items) {
            const matchItem = itemsRes.account_items.find(item => 
                item.name.includes("支払手数料") || 
                item.name.includes("外注費") || 
                item.name.includes("広告宣伝費")
            );
            if (matchItem) {
                accountItemId = matchItem.id;
                console.log("[freee API] Resolved payout account_item_id:", accountItemId);
            }
        }
    } catch (err) {
        console.warn("[freee API] Failed to resolve account item id dynamically for payout:", err.message);
    }

    // 2. 動的に決済口座のIDを探す
    let walletableId = null;
    let walletableType = "bank_account";
    try {
        const walletablesRes = await freeeRequest(`/walletables?company_id=${activeCompanyId}`);
        if (walletablesRes && walletablesRes.walletables && walletablesRes.walletables.length > 0) {
            walletableId = walletablesRes.walletables[0].id;
            walletableType = walletablesRes.walletables[0].type;
            console.log("[freee API] Resolved payout walletable_id:", walletableId, "type:", walletableType);
        }
    } catch (err) {
        console.warn("[freee API] Failed to resolve walletable dynamically for payout:", err.message);
    }

    // 3. 税区分（tax_code）の動的解決
    let taxCode = payoutData?.taxCode;
    if (taxCode === undefined) {
        try {
            const dbHelper = require('./db_connector');
            const row = await dbHelper.query.get("SELECT value FROM admin_settings WHERE key = 'freee_default_expense_tax_code'");
            if (row && row.value) {
                taxCode = parseInt(row.value, 10);
                console.log("[freee API] Resolved default expense tax_code from database:", taxCode);
            }
        } catch (dbErr) {
            console.warn("[freee API] Failed to query default expense tax_code from DB:", dbErr.message);
        }
    }
    if (taxCode === undefined) {
        taxCode = 0; // 最終フォールバック (対象外・非課税)
    }

    // freee API 支出 (expense) 登録用ペイロード
    const payload = {
        issue_date: issueDate,
        type: "expense",      // expense = 支出
        company_id: activeCompanyId,
        details: [
            {
                tax_code: taxCode,
                account_item_id: accountItemId,
                amount: amount,
                description: description
            }
        ],
        payments: walletableId ? [
            {
                amount: amount,
                date: issueDate,
                from_walletable_type: walletableType,
                from_walletable_id: walletableId
            }
        ] : [],
        receipt_ids: []
    };

    try {
        const result = await freeeRequest('/deals', 'POST', payload);
        console.log("[freee API] Payout entry created successfully:", result);
        return result;
    } catch (e) {
        console.error("[freee API] Failed to create payout deal. Error details:", e.message);
        throw e;
    }
}

module.exports = {
    setAccessToken,
    getCompanies,
    getAccountItems,
    createSalesEntry,
    createAccountItem,
    updateAccountItem,
    deleteAccountItem,
    updateCompany,
    getDeals,
    createPayoutEntry
};

