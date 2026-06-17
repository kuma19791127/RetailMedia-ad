const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const htmlContent = fs.readFileSync(path.join(__dirname, '../ad_dashboard.html'), 'utf8');

const dom = new JSDOM(htmlContent, {
    runScripts: "dangerously",
    resources: "usable",
    url: "http://localhost:3000/ad_dashboard.html",
    virtualConsole: new (require('jsdom').VirtualConsole)()
});

dom.window.VirtualConsole = dom.virtualConsole;

dom.virtualConsole.on("log", (message) => {
    console.log("[JSDOM Log]", message);
});

dom.virtualConsole.on("error", (message) => {
    console.error("[JSDOM Error]", message);
});

dom.virtualConsole.on("warn", (message) => {
    console.warn("[JSDOM Warn]", message);
});

// Mock sessionStorage / localStorage
dom.window.sessionStorage.setItem('retailMediaAuth', 'true');
dom.window.sessionStorage.setItem('retailUserEmail', 'advertiser@demo.com');
dom.window.localStorage.setItem('retailMediaSavedEmail', 'advertiser@demo.com');

console.log("JSDOM loading ad_dashboard.html...");

// Wait a bit for DOMContentLoaded
setTimeout(() => {
    console.log("JSDOM Execution Finished.");
    process.exit(0);
}, 2000);
