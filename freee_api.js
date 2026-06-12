/**
 * freee API Integration Module
 * Handles automated bookkeeping and synchronization with freee Accounting.
 */

require('dotenv').config();
const FREEE_API_BASE = "https://api.freee.co.jp/api/1";

// 開発用テスト事業所 (Development Test Company)
// If you want to use the main company "non-logi", change this to 10685574
const DEFAULT_COMPANY_ID = 10685574; 

// Helper to check what token to use (dynamic or static env)
function getAccessToken() {
    // Dynamically require server module or global session if available
    const serverModule = require('./server_retail_dist');
    const token = (serverModule && typeof serverModule.getFreeeToken === 'function') 
        ? serverModule.getFreeeToken() 
        : (process.env.FREEE_ACCESS_TOKEN || null);
    
    // For review sandbox purposes, if no token, return mock token
    return token || "mock_sandbox_access_token_for_freee_review";
}

/**
 * Helper to make API requests to freee
 */
async function freeeRequest(endpoint, method = 'GET', data = null) {
    const url = `${FREEE_API_BASE}${endpoint}`;
    const token = getAccessToken();
    
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
        console.error("[freee API Error]", responseData);
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

    // freee API expects a specific payload format for Deals (取引)
    const payload = {
        issue_date: issueDate,
        type: "income",      // income = 収入 (売上)
        company_id: activeCompanyId,
        details: [
            {
                tax_code: 1, // 課税売上10%
                account_item_id: accountItemId, // 動的に解決した勘定科目IDをセット
                amount: amount,
                item_id: null,
                section_id: null,
                tag_ids: [],
                segment_1_tag_id: null,
                segment_2_tag_id: null,
                segment_3_tag_id: null,
                description: description,
                vat: Math.floor(amount - (amount / 1.1)) // Calculate 10% VAT
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

module.exports = {
    getCompanies,
    getAccountItems,
    createSalesEntry
};
