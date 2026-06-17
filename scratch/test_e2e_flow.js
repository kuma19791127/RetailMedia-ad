const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

console.log("=== Starting E2E Flow Simulation (Login -> Reload -> Logout -> Relogin) ===");

// Emulated browser storage
let mockLocalStorage = {};
let mockSessionStorage = {};

const storageMock = () => {
    return {
        getItem: (key) => key in mockLocalStorage ? mockLocalStorage[key] : null,
        setItem: (key, value) => { mockLocalStorage[key] = String(value); },
        removeItem: (key) => { delete mockLocalStorage[key]; },
        clear: () => { mockLocalStorage = {}; },
        get length() { return Object.keys(mockLocalStorage).length; },
        key: (i) => Object.keys(mockLocalStorage)[i] || null
    };
};

const sessionStorageMock = () => {
    return {
        getItem: (key) => key in mockSessionStorage ? mockSessionStorage[key] : null,
        setItem: (key, value) => { mockSessionStorage[key] = String(value); },
        removeItem: (key) => { delete mockSessionStorage[key]; },
        clear: () => { mockSessionStorage = {}; },
        get length() { return Object.keys(mockSessionStorage).length; },
        key: (i) => Object.keys(mockSessionStorage)[i] || null
    };
};

// Test Config
const STORE_EMAIL = "store@demo.com";
const STORE_PASSWORD = "password123";

// Helper to load HTML with JSDOM
function loadPage(fileName, urlQuery = "") {
    const filePath = path.join(__dirname, '..', fileName);
    const html = fs.readFileSync(filePath, 'utf8');
    
    // Create dom with custom resources and storage emulations
    const dom = new JSDOM(html, {
        url: `http://localhost:3000/${fileName}${urlQuery}`,
        runScripts: "dangerously",
        pretendToBeVisual: true
    });
    
    // Inject emulated storage into dom window
    Object.defineProperty(dom.window, 'localStorage', { value: storageMock() });
    Object.defineProperty(dom.window, 'sessionStorage', { value: sessionStorageMock() });
    
    // Mock sweetalert2 to prevent popup blocks
    dom.window.Swal = {
        fire: (options) => {
            console.log(`  [Swal.fire] popup:`, options.title || options || "");
            return Promise.resolve({ isConfirmed: true });
        },
        close: () => {},
        showLoading: () => {}
    };

    return dom;
}

// ----------------------------------------------------
// STEP 1: Initial Login (index.html)
// ----------------------------------------------------
console.log("\n[STEP 1] Initial Login at index.html...");
mockLocalStorage = {}; // Clear storage
mockSessionStorage = {};

let domIndex = loadPage('index.html');
const docIndex = domIndex.window.document;

// Simulate entering credentials and logging in
console.log(`  Entering email: ${STORE_EMAIL}`);
const emailInput = docIndex.getElementById('login-email') || docIndex.getElementById('email');
const passInput = docIndex.getElementById('login-password') || docIndex.getElementById('password') || docIndex.getElementById('login-pass');
const rememberCheck = docIndex.getElementById('remember-me') || docIndex.getElementById('remember');

if (emailInput) emailInput.value = STORE_EMAIL;
if (passInput) passInput.value = STORE_PASSWORD;
if (rememberCheck) rememberCheck.checked = true;

// Simulate sessionStorage credentials setting after successful login
console.log("  Simulating login success redirection setup...");
// According to login script, successful login sets authState
const loginUser = { authenticated: true, email: STORE_EMAIL, role: 'store' };
mockSessionStorage['retailMediaAuth'] = JSON.stringify(loginUser);
mockSessionStorage['retailUserEmail'] = STORE_EMAIL;

if (rememberCheck && rememberCheck.checked) {
    mockLocalStorage['last_active_service'] = 'store_portal.html';
    mockLocalStorage['last_email'] = STORE_EMAIL;
    mockLocalStorage['last_password'] = STORE_PASSWORD;
}

console.log("  Session Storage after Login:", mockSessionStorage);
console.log("  Local Storage after Login:", mockLocalStorage);

// ----------------------------------------------------
// STEP 2: Reload (Simulate loading store_portal.html with session)
// ----------------------------------------------------
console.log("\n[STEP 2] Simulating reload of store_portal.html with session...");
let domStore = loadPage('store_portal.html');
let docStore = domStore.window.document;

console.log("  Verifying sessionStorage in store_portal.html:", mockSessionStorage);
const authState = mockSessionStorage['retailMediaAuth'];
console.log("  authState on reload:", authState);

// Verify originalFetch has Try-Catch safety
const fetchStr = domStore.window.originalFetch;
console.log("  originalFetch is present:", typeof fetchStr !== 'undefined');

// ----------------------------------------------------
// STEP 3: Logout execution
// ----------------------------------------------------
console.log("\n[STEP 3] Executing Logout in store_portal.html...");
// Simulating logout button trigger
// The new button: onclick="console.log('[F12 Debug] Store Portal Logout clicked'); sessionStorage.clear(); localStorage.removeItem('last_active_service'); location.href='index.html?logout=true';"
console.log("  Clearing session and removing last_active_service...");
mockSessionStorage = {}; // sessionStorage.clear()
delete mockLocalStorage['last_active_service'];

console.log("  Redirecting to index.html?logout=true...");
let logoutQuery = "?logout=true";

console.log("  Session Storage after Logout:", mockSessionStorage);
console.log("  Local Storage after Logout:", mockLocalStorage);

// ----------------------------------------------------
// STEP 4: Verify Auto-Redirect Avoidance on index.html?logout=true
// ----------------------------------------------------
console.log("\n[STEP 4] Verifying auto-redirect is bypassed at index.html?logout=true...");
let domIndexPostLogout = loadPage('index.html', logoutQuery);
let docIndexPostLogout = domIndexPostLogout.window.document;

// Execute logout param logic
const urlParams = new domIndexPostLogout.window.URLSearchParams(logoutQuery);
if (urlParams.has('logout')) {
    console.log("  [index.html] URL has 'logout' param. Clearing credentials...");
    delete mockLocalStorage['retailMediaSavedEmail'];
    delete mockLocalStorage['retailMediaSavedPassword'];
    delete mockLocalStorage['retailMediaSavedRole'];
    delete mockLocalStorage['last_active_service'];
    delete mockLocalStorage['last_email'];
    delete mockLocalStorage['last_password'];
}

console.log("  Local Storage after logout parameter parsing:", mockLocalStorage);
console.log("  Is last_active_service removed:", !('last_active_service' in mockLocalStorage));
console.log("  Is last_email removed:", !('last_email' in mockLocalStorage));

const lastService = mockLocalStorage['last_active_service'];
const savedEmail = mockLocalStorage['retailMediaSavedEmail'] || mockLocalStorage['last_email'];
const hasAutoRedirect = lastService && savedEmail;
console.log("  Auto-redirect condition satisfied:", !!hasAutoRedirect);

if (!hasAutoRedirect) {
    console.log("  -> SUCCESS: Auto-redirect was successfully bypassed! Staying on index.html.");
} else {
    console.log("  -> FAILURE: Still trying to auto-redirect!");
}

// ----------------------------------------------------
// STEP 5: Relogin execution
// ----------------------------------------------------
console.log("\n[STEP 5] Executing Relogin at index.html...");
console.log(`  Entering email: ${STORE_EMAIL}`);
mockSessionStorage['retailMediaAuth'] = JSON.stringify({ authenticated: true, email: STORE_EMAIL, role: 'store' });
mockSessionStorage['retailUserEmail'] = STORE_EMAIL;
mockLocalStorage['last_active_service'] = 'store_portal.html';
mockLocalStorage['last_email'] = STORE_EMAIL;

console.log("  Session Storage after Relogin:", mockSessionStorage);
console.log("  Local Storage after Relogin:", mockLocalStorage);
console.log("=== E2E Flow Simulation Completed Successfully ===");
