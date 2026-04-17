const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/index.html', 'utf8');

const target = `<form id="loginForm" method="dialog" onsubmit="handleLogin(event)">`;

const newButton = `
            <div style="margin-top:0px; margin-bottom:20px; font-size:12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px;">
                <a href="anywhere_regi.html" target="_blank" style="color:var(--secondary); font-weight:bold; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px; background:rgba(16,185,129,0.1); padding:10px; border-radius:8px;">
                    <i class="fa-solid fa-mobile-screen"></i> 一般のお買い物客向け「どこでもレジ」はこちら
                </a>
            </div>
`;

if(doc.includes(target) && !doc.includes('anywhere_regi.html')) {
    doc = doc.replace(target, newButton + target);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/index.html', doc, 'utf8');
    console.log("Added index to anywhere link");
} else {
    console.log("Already added or not found");
}
