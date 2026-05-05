const fs = require('fs');

// ==== 1. Patch advertiser_dashboard.html ====
let adDash = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html', 'utf8');

// Insert a script to set min budget dynamically
if (!adDash.includes("document.getElementById('cp-budget').min")) {
    const minBudgetScript = `
        // Dynamic Budget Limit based on Demo/Prod Mode
        window.addEventListener('DOMContentLoaded', () => {
            const isDemoUser = (sessionStorage.getItem('retailUserEmail') || '').includes('@demo.com');
            const budgetInput = document.getElementById('cp-budget');
            if(budgetInput) {
                budgetInput.min = isDemoUser ? 0 : 1000;
                budgetInput.placeholder = isDemoUser ? '0 (デモ無料)' : '1000';
            }
        });
    `;
    adDash = adDash.replace('</head>', `    <script>${minBudgetScript}</script>\n</head>`);
}
fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html', adDash, 'utf8');


// ==== 2. Patch ad_dashboard.html ====
let adMain = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html', 'utf8');

// Patch initiateCampaign logic
adMain = adMain.replace(/const isDemoUser = window\.currentUser && window\.currentUser\.email && window\.currentUser\.email\.includes\('@demo\.com'\);/g, 
    "const isDemoUser = window.currentUser && window.currentUser.email && window.currentUser.email.includes('@demo.com');\n            const minBudgetNum = isDemoUser ? 0 : 1000;");

// Fix swal-budget HTML
adMain = adMain.replace(/<input id="swal-budget" type="number" class="swal2-input" placeholder="例: 1000" min="1000" style="margin-top:0;">/g, 
    '<input id="swal-budget" type="number" class="swal2-input" placeholder="例: ${minBudgetNum}" min="${minBudgetNum}" style="margin-top:0;">');

// Fix validation message
adMain = adMain.replace(/if \(!name \|\| !budget \|\| parseInt\(budget\) < 1000\) \{[\s\n\r]*Swal\.showValidationMessage\('名前と予算\(最低1,000円\)は必須です'\);/g, 
    "if (!name || budget === '' || parseInt(budget) < minBudgetNum) {\n                        Swal.showValidationMessage(`名前と予算(最低${minBudgetNum}円)は必須です`);");

// Patch registerCreditCard logic
adMain = adMain.replace(/async function registerCreditCard\(\) \{[\s\n\r]*try \{/g, 
    `async function registerCreditCard() {
            try {
                const isDemoUser = window.currentUser && window.currentUser.email && window.currentUser.email.includes('@demo.com');
                const minBudgetNum = isDemoUser ? 0 : 1000;`);

adMain = adMain.replace(/preConfirm: \(value\) => \{ const v = parseInt\(value\); if\(!v \|\| v < 1000\) \{ Swal\.showValidationMessage\('最低課金金額は1,000円です'\); return false; \} return v; \},/g, 
    "preConfirm: (value) => { const v = parseInt(value); if(isNaN(v) || v < minBudgetNum) { Swal.showValidationMessage(`最低課金金額は${minBudgetNum}円です`); return false; } return v; },");

adMain = adMain.replace(/inputAttributes: \{ min: 1000, step: 1000 \},/g, 
    "inputAttributes: { min: minBudgetNum, step: 1000 },");

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html', adMain, 'utf8');

console.log('Successfully patched budget validations!');
