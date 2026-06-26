const freeeApi = require('../freee_api');

async function testAuditDirect() {
    const logs = [];
    function log(message, details = null) {
        const entry = { time: new Date().toISOString(), message, details };
        console.log(`[Test] ${message}`, details ? JSON.stringify(details) : '');
        logs.push(entry);
    }

    try {
        log("Testing getCompanies()...");
        const companiesRes = await freeeApi.getCompanies();
        if (!companiesRes || !companiesRes.companies || companiesRes.companies.length === 0) {
            throw new Error("No companies found.");
        }
        
        const companyId = companiesRes.companies[0].id;
        log(`Using Company ID: ${companyId}`);

        log("Testing getDeals()...");
        const deals = await freeeApi.getDeals(companyId);
        log(`Deals retrieved: ${deals.deals ? deals.deals.length : 0}`);

        log("Testing getAccountItems() for category resolution...");
        const items = await freeeApi.getAccountItems(companyId);
        const categoryId = items.account_items[0].account_category_id;
        log(`Using category ID: ${categoryId}`);

        log("Testing createAccountItem()...");
        const createRes = await freeeApi.createAccountItem(companyId, {
            name: "Audit Test Account Item",
            account_category_id: categoryId
        });
        const itemId = createRes.account_item.id;
        log(`Created account item ID: ${itemId}`);

        log("Testing updateAccountItem()...");
        await freeeApi.updateAccountItem(companyId, itemId, {
            name: "Audit Test Account Item Updated"
        });
        log("Account item updated.");

        log("Testing deleteAccountItem()...");
        await freeeApi.deleteAccountItem(companyId, itemId);
        log("Account item deleted.");

        log("Testing updateCompany()...");
        await freeeApi.updateCompany(companyId, {
            name: companiesRes.companies[0].name,
            display_name: companiesRes.companies[0].display_name
        });
        log("Company information updated.");

        log("All direct audit tests passed successfully!");
    } catch (err) {
        log(`Audit Test failed with error: ${err.message}`, { stack: err.stack });
    }
}

testAuditDirect();
