const freeeApi = require('../freee_api');

async function test() {
    try {
        console.log("Testing getCompanies()...");
        const companies = await freeeApi.getCompanies();
        console.log("Companies:", JSON.stringify(companies, null, 2));

        if (companies && companies.companies && companies.companies.length > 0) {
            const companyId = companies.companies[0].id;
            console.log(`Testing getAccountItems() for company ${companyId}...`);
            const items = await freeeApi.getAccountItems(companyId);
            console.log(`Found ${items.account_items.length} account items.`);
        }
    } catch (err) {
        console.error("Test failed:", err);
    }
}

test();
