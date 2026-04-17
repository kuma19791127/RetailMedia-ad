const fs = require('fs');

// 1. Completely strip anything related to anywhere_regi.html from index.html
let indexContent = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/index.html', 'utf8');

// Find the line that links to anywhere_regi and remove it. Let's do it line by line for safety.
const lines = indexContent.split('\n');
const newLines = [];
let skipBlock = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('anywhere_regi.html') || lines[i].includes('モバイル片手決済') || lines[i].includes('一般のお買い物客向け')) {
        // if this line contains anywhere_regi link, skip it
        // also try to skip the div wrapping it by looking backwards
        if (newLines.length > 0 && newLines[newLines.length - 1].includes('<div')) {
            newLines.pop(); // remove opening div
            skipBlock = true; // skip closing div later
        }
        continue;
    }
    if (skipBlock && lines[i].includes('</div>')) {
        skipBlock = false;
        continue;
    }
    newLines.push(lines[i]);
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/index.html', newLines.join('\n'), 'utf8');
console.log("Cleaned index.html.");


// 2. Add "JANコードを読み込む" link in store_portal.html underneath the header
const spPath = 'C:/Users/one/Desktop/RetailMedia_System/store_portal.html';
if (fs.existsSync(spPath)) {
    let spContent = fs.readFileSync(spPath, 'utf8');
    
    // Add "JANコードを読み込む" link to mobile navigation and desktop sidebar
    if (spContent.includes('<a href="#admin" class="nav-link"><i class="fa-solid fa-gear"></i> 管理</a>') && !spContent.includes('JANコードを読み込む')) {
        spContent = spContent.replace(
            '<a href="#admin" class="nav-link"><i class="fa-solid fa-gear"></i> 管理</a>', 
            '<a href="#admin" class="nav-link"><i class="fa-solid fa-gear"></i> 管理</a>\n            <a href="anywhere_regi.html" target="_blank" class="nav-link" style="color:#fbbf24;"><i class="fa-solid fa-barcode"></i> JANコードを読み込む</a>'
        );
        fs.writeFileSync(spPath, spContent, 'utf8');
        console.log("Added JAN code scanner link to mobile nav in store_portal.html");
    }

    if (spContent.includes('<a href="#admin" class="sidebar-link"><i class="fa-solid fa-gear"></i> 連携・設定</a>') && !spContent.includes('JANコードを読み込む')) {
        spContent = spContent.replace(
            '<a href="#admin" class="sidebar-link"><i class="fa-solid fa-gear"></i> 連携・設定</a>', 
            '<a href="#admin" class="sidebar-link"><i class="fa-solid fa-gear"></i> 連携・設定</a>\n                <a href="anywhere_regi.html" target="_blank" class="sidebar-link" style="color:#fbbf24;"><i class="fa-solid fa-barcode"></i> JANコードを読み込む</a>'
        );
        fs.writeFileSync(spPath, spContent, 'utf8');
        console.log("Added JAN code scanner link to sidebar in store_portal.html");
    }
    
} else {
    console.log("store_portal.html not found, checking pos_admin.html instead...");
}

// 3. And check pos_admin.html as well for the same logic
const paPath = 'C:/Users/one/Desktop/RetailMedia_System/pos_admin.html';
if (fs.existsSync(paPath)) {
    let paContent = fs.readFileSync(paPath, 'utf8');
    
    const settingsLink = `<a href="#settings" class="sidebar-link" onclick="showTab('settings')"><i class="fa-solid fa-gear"></i> 連携設定</a>`;
    const newJanLink = `\n                <a href="anywhere_regi.html" target="_blank" class="sidebar-link" style="color:#fbbf24; font-weight:bold;"><i class="fa-solid fa-barcode"></i> JANコードを読み込む</a>`;
    
    if (paContent.includes(settingsLink) && !paContent.includes('JANコードを読み込む')) {
        paContent = paContent.replace(settingsLink, settingsLink + newJanLink);
        fs.writeFileSync(paPath, paContent, 'utf8');
        console.log("Added JAN link to pos_admin.html sidebar.");
    }
}
