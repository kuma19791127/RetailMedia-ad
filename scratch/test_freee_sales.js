require('dotenv').config({ path: require('path').resolve(__dirname, '../.env_utf8') });
const freeeApi = require('../freee_api');
async function test() {
    try {
        console.log("Starting freee API registration validation for non-logi (10685574)...");
        const result = await freeeApi.createSalesEntry(10685574, {
            amount: 50000,
            description: "日次売上自動連携テスト (AI自動検証)"
        });
        console.log("TEST RESULT SUCCESS:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("TEST RESULT FAILED:", err.message || err);
    }
}
test();
