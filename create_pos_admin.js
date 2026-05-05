const fs = require('fs');

let sp = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/store_portal.html', 'utf8');

const targetId = `<div class="card" style="margin-bottom:20px; border-left: 5px solid #3b82f6;" id="pos-sales-container">`;
const scriptEnd = `</script>`;

let posHtmlSnippet = "";

if (sp.includes(targetId)) {
    const startIdx = sp.indexOf(targetId);
    let endIdx = sp.indexOf(scriptEnd, startIdx);
    
    // find next scriptEnd just in case it doesn't cover everything
    endIdx += scriptEnd.length; 
    
    posHtmlSnippet = sp.substring(startIdx, endIdx);
    
    sp = sp.substring(0, startIdx) + sp.substring(endIdx);
    
    // clean up empty line
    sp = sp.replace(/\n\s*\n/g, '\n\n');
    
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/store_portal.html', sp, 'utf8');
    console.log("Reverted store_portal.html");
}

let posAdminTemplate = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>小売りモバイルPOS レジ管理画面</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;800&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        body { font-family: 'Noto Sans JP', sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
        .header h1 { margin: 0; font-size: 24px; color: #0f172a; }
        .btn-logout { padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
        
        .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .revenue-big { font-size: 36px; font-weight: bold; color: #27ae60; }
        .card-label { font-size: 12px; color: #95a5a6; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏪 モバイルPOS 店舗管理画面</h1>
        <div>
            <button onclick="window.location.href='index.html'" style="padding: 8px 16px; background: #cbd5e1; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px; font-weight:bold;">総合トップへ戻る</button>
            <button class="btn-logout" onclick="logout()">ログアウト</button>
        </div>
    </div>
    
    <div style="max-width: 1000px; margin: 0 auto;">
        ${posHtmlSnippet || '<div>データ反映中...</div>'}
    </div>

    <script>
        function logout() {
            sessionStorage.removeItem('retailMediaAuth');
            window.location.replace('index.html');
        }
    </script>
</body>
</html>
`;

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/pos_admin.html', posAdminTemplate, 'utf8');
console.log("Created pos_admin.html");
