const fs = require('fs');

let docI = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/index.html', 'utf8');

docI = docI.replace(/<div style="margin-top:0px; margin-bottom:20px; font-size:12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px;">\s*<a href="anywhere_regi\.html".*?<\/a>\s*<\/div>/s, '');
fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/index.html', docI, 'utf8');

let docA = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/anywhere_regi.html', 'utf8');
if(docA.includes('<a href="index.html" style="color:#2563EB; font-weight:bold;')) {
    docA = docA.replace(/<a href="index.html" style="color:#2563EB; font-weight:bold;.*?<\/a>/g, '');
    
}
const loginTarget = `                    <div class="role-chip" onclick="selectRole('creator', this)">🎨 クリエイター</div>
                </div>
            </div>`;

const newLink = `
            <div style="margin-bottom:20px; text-align:center;">
                <a href="anywhere_regi.html" target="_blank" style="color:var(--primary); font-weight:bold; text-decoration:underline;">モバイル片手決済 (一般向け) はこちら</a>
            </div>`;

if(docI.indexOf(newLink) === -1) {
    docI = docI.replace(loginTarget, loginTarget + newLink);
}

const anywhereHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>どこでもレジ - anywhere-regi</title>
    <script src="https://unpkg.com/@zxing/library@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        :root {
            --primary: #10B981;
            --primary-dark: #059669;
            --bg-color: #F8FAFC;
            --text-main: #1E293B;
            --text-sub: #64748B;
            --glass-bg: rgba(255, 255, 255, 0.95);
        }

        body { font-family: -apple-system, system-ui, sans-serif; margin: 0; background: var(--bg-color); color: var(--text-main); user-select: none; }
        
        .page { display: none; padding: 20px; padding-bottom: 90px; }
        .page.active { display: block; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }

        /* Login Screen */
        .login-card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; }
        .login-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .login-input { width: 100%; padding: 15px; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 15px; font-size: 16px; box-sizing: border-box; }
        .btn-primary { background: var(--primary); color: white; border: none; width: 100%; padding: 15px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
        .btn-primary:active { transform: scale(0.98); }
        .btn-pay { background: #3B82F6; }

        /* Store Selection */
        .store-selector-bar { display: flex; align-items: center; justify-content: space-between; padding: 15px; background: white; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .store-selector-bar select { border: none; font-size: 16px; font-weight: bold; color: var(--primary); background: transparent; outline: none; }
        
        /* Scanner Area */
        #scanner-container { position: relative; width: 100%; height: 300px; border-radius: 16px; overflow: hidden; background: #000; box-shadow: 0 10px 20px rgba(0,0,0,0.1); margin-bottom: 20px; }
        #video { width: 100%; height: 100%; object-fit: cover; }
        .scan-guide { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70%; height: 50%; border: 2px dashed rgba(255,255,255,0.7); box-shadow: 0 0 0 1000px rgba(0,0,0,0.4); pointer-events: none; }
        .scan-mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; cursor: pointer; transition: 0.3s; }
        .mask-icon { font-size: 40px; margin-bottom: 10px; }

        /* Action Area */
        .action-area { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }

        /* Cart */
        .cart-container { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
        .total-display { font-size: 32px; font-weight: 900; text-align: right; margin-bottom: 15px; color: var(--text-main); display: flex; justify-content: space-between; align-items: baseline; }
        .total-display span { font-size: 16px; color: var(--text-sub); }
        
        .cart-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #E2E8F0; align-items: center; }
        .cart-item:last-child { border-bottom: none; }
        .item-name { font-weight: bold; font-size: 15px; }
        .item-code { font-size: 12px; color: var(--text-sub); }
        .item-price { font-weight: bold; font-size: 16px; }

        /* Payment Card */
        .payment-card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; }

        /* Reset Modal */
        #modal-reset { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; justify-content:center; align-items:center; }
    </style>
</head>
<body>

    <!-- 1. Login Screen (For Customers) -->
    <div id="page-login" class="page active">
        <div style="margin-bottom: 30px; font-size:28px; text-align: center; font-weight:bold; color:var(--primary);">どこでもレジ</div>
        <div class="login-card">
            <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
            <h2 class="login-title">一般ユーザーログイン</h2>
            <p style="color:var(--text-sub); font-size:14px; margin-bottom:20px;">スマホで簡単に決済</p>
            
            <form onsubmit="event.preventDefault(); document.getElementById('page-login').classList.remove('active'); document.getElementById('page-pos').classList.add('active'); startScanner();" style="width:100%; margin:0; padding:0;">
            <button type="submit" class="btn-primary">ゲストとして開始</button>
            </form>
            
            <div style="margin-top:20px; font-size:12px; border-top: 1px solid #eee; padding-top: 15px;">
                <a href="pos_admin.html" style="color:#2563EB; font-weight:bold; text-decoration:none; display:block; margin-bottom:10px;">👔 小売店舗・管理者向けのログインはこちら</a>
            </div>
        </div>
    </div>

    <!-- 2. POS Screen -->
    <div id="page-pos" class="page">
        <div class="store-selector-bar">
            <span>📱 どこでもレジ</span>
            <button class="btn-primary" style="padding:5px 10px; width:auto; font-size:12px;" onclick="location.reload()">終了</button>
        </div>

        <div id="scanner-container">
            <video id="video"></video>
            <div class="scan-guide"></div>
            <div id="scanner-mask" class="scan-mask" onclick="startScanner()">
                <div class="mask-icon">📷</div>
                <div id="mask-msg">Tap to Start Camera</div>
            </div>
        </div>

        <div class="action-area">
            <button class="btn-primary" style="background:var(--text-sub);" onclick="resumeScan()">次を読み取る</button>
            <button class="btn-primary btn-pay" onclick="document.getElementById('page-pos').classList.remove('active'); document.getElementById('page-payment').classList.add('active');">合計金額で決済へ</button>
        </div>

        <div class="cart-container">
            <div class="total-display"><span>Total:</span>¥<span id="total-display">0</span></div>
            <div id="items"></div>
        </div>
    </div>

    <!-- 3. Payment Screen -->
    <div id="page-payment" class="page">
        <div class="payment-card">
            <h2 style="color:var(--text-sub);">お支払い金額</h2>
            <div style="font-size: 42px; font-weight:800; margin:10px 0;">¥<span id="final-total">0</span></div>

            <button class="btn-primary" style="background:#0f172a; margin-top:20px;" onclick="processPayment()">クレジットカードで決済</button>

            <button style="background:none; border:none; color:var(--text-sub); margin-top:25px; cursor:pointer;" onclick="document.getElementById('page-payment').classList.remove('active'); document.getElementById('page-pos').classList.add('active');">キャンセル・戻る</button>
        </div>
    </div>

    <script>
        let codeReader;
        let cart = [];
        let total = 0;

        // Dummy Products
        const products = {
            "4901085122119": { name: "グリーンティー", price: 150 },
            "4902102072618": { name: "コカ・コーラ", price: 160 },
            "4901330502881": { name: "ポテトチップス", price: 120 }
        };

        function startScanner() {
            document.getElementById('scanner-mask').style.display = 'none';
            if(!codeReader) codeReader = new ZXing.BrowserMultiFormatReader();
            
            codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
                if (result) {
                    const code = result.getText();
                    if(products[code]) {
                        codeReader.reset();
                        document.getElementById('scanner-mask').style.display = 'flex';
                        document.getElementById('mask-msg').innerText = "読み取り成功！";
                        
                        cart.push(products[code]);
                        total += products[code].price;
                        updateDisplay();
                        
                        Swal.fire({toast:true, position:'top', icon:'success', title: products[code].name + " を追加", showConfirmButton:false, timer:1500});
                    }
                }
            });
        }

        function resumeScan() {
            startScanner();
        }

        function updateDisplay() {
            document.getElementById('total-display').innerText = total;
            document.getElementById('final-total').innerText = total;
            const itemsDiv = document.getElementById('items');
            itemsDiv.innerHTML = '';
            cart.forEach(item => {
                itemsDiv.innerHTML += \`<div class="cart-item">
                    <div>
                        <div class="item-name">\${item.name}</div>
                    </div>
                    <div class="item-price">¥\${item.price}</div>
                </div>\`;
            });
        }

        function processPayment() {
            Swal.fire('決済完了', 'ご利用ありがとうございました！', 'success').then(() => {
                location.reload();
            });
        }
    </script>
</body>
</html>`;

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/anywhere_regi.html', anywhereHtml, 'utf8');
console.log('Fixed separation logic.');
