// Runtime verification script for freee token persistence and circular dependency fix
const path = require('path');
const fs = require('fs');

console.log("[Test] Initializing db_connector...");
const dbHelper = require('../db_connector');
const freeeApi = require('../freee_api');

// Setup mock config for test environment
process.env.FREEE_ACCESS_TOKEN = "env_fallback_token_123456";

// Mimic server_retail_dist functions
let currentFreeeToken = null;

async function loadFreeeTokenFromDB() {
    try {
        const row = await dbHelper.query.get("SELECT value FROM admin_settings WHERE key = 'freee_access_token'");
        if (row && row.value) {
            currentFreeeToken = row.value;
            console.log("[Test] Loaded token from database. Length:", currentFreeeToken.length);
        } else {
            console.log("[Test] No active token found in database. Using environment fallback.");
            currentFreeeToken = process.env.FREEE_ACCESS_TOKEN || null;
        }
        if (typeof freeeApi !== 'undefined' && typeof freeeApi.setAccessToken === 'function') {
            freeeApi.setAccessToken(currentFreeeToken);
        }
    } catch (e) {
        console.error("[Test] Failed to load token from database:", e.message);
    }
}

async function saveFreeeTokenToDB(token) {
    try {
        await dbHelper.query.run("DELETE FROM admin_settings WHERE key = 'freee_access_token'");
        await dbHelper.query.run("INSERT INTO admin_settings (key, value) VALUES ('freee_access_token', ?)", [token]);
        currentFreeeToken = token;
        console.log("[Test] Saved token to database. Length:", token.length);
        if (typeof freeeApi !== 'undefined' && typeof freeeApi.setAccessToken === 'function') {
            freeeApi.setAccessToken(currentFreeeToken);
        }
    } catch (e) {
        console.error("[Test] Failed to save token to database:", e.message);
    }
}

async function deleteFreeeTokenFromDB() {
    try {
        await dbHelper.query.run("DELETE FROM admin_settings WHERE key = 'freee_access_token'");
        currentFreeeToken = null;
        console.log("[Test] Deleted token from database.");
        if (typeof freeeApi !== 'undefined' && typeof freeeApi.setAccessToken === 'function') {
            freeeApi.setAccessToken(null);
        }
    } catch (e) {
        console.error("[Test] Failed to delete token from database:", e.message);
    }
}

async function runTest() {
    console.log("\n--- Start Runtime Verification ---");

    // Wait briefly for DB setup to finish
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 1: Ensure initial load uses fallback (since test runs on empty/clean local SQLite or existing DB)
    console.log("\n[Step 1] Loading initial token...");
    await loadFreeeTokenFromDB();
    
    // Dynamically retrieve token from freee_api (we can't require server_retail_dist directly to prevent port collisions, 
    // but we can check if freeeApi's local variable was updated correctly via setAccessToken)
    // We will retrieve it via a test helper or check behavior.
    // Let's check using getAccessToken if exposed, or since we exported getDeals etc.
    // Wait, getAccessToken is not exported, but it's used inside freeeRequest. 
    // We can verify that freeeApi exports getCompanies, and we can stub freeeRequest or check if token is updated.
    // Let's modify freee_api.js temporarily if needed? No, we can write a test in the script.
    // Actually, we can check by getting the companies or checking if getAccessToken is available.
    // Wait, getAccessToken is not in module.exports, but we can verify activeAccessToken by exporting or inspecting.
    // Since getAccessToken is not exported, how do we verify?
    // Let's check freee_api.js exports:
    // module.exports = { setAccessToken, getCompanies, ... }
    // We can call getCompanies and catch the request, or we can check the logs from the console.log we added to freeeRequest!
    // Inside freeeRequest, we added:
    // console.log(`[freee API Request] URL: ${url}, Method: ${method}, Token Length: ...`);
    // So if we call getCompanies(), it will print the token substring, which confirms the token used!

    // Let's try calling getCompanies() - it will fail with 401 but we'll see the log!
    try {
        await freeeApi.getCompanies();
    } catch (err) {
        // Expected failure, check printed logs above
    }

    // Step 2: Save a dummy token and verify
    console.log("\n[Step 2] Saving dummy token 'my_secret_token_abc123'...");
    await saveFreeeTokenToDB("my_secret_token_abc123");

    // Call getCompanies to verify if the printed token length/substring matches 'my_secret_token_abc123'
    try {
        await freeeApi.getCompanies();
    } catch (err) {
        // Expected failure, check printed logs above
    }

    // Step 3: Load again to ensure persistence
    console.log("\n[Step 3] Loading token again to verify DB persistence...");
    currentFreeeToken = null; // clear cache
    await loadFreeeTokenFromDB();

    try {
        await freeeApi.getCompanies();
    } catch (err) {
        // Expected failure
    }

    // Step 4: Delete token
    console.log("\n[Step 4] Deleting token...");
    await deleteFreeeTokenFromDB();

    try {
        await freeeApi.getCompanies();
    } catch (err) {
        // Expected failure
    }

    console.log("\n--- Runtime Verification Completed ---");
    process.exit(0);
}

runTest();
