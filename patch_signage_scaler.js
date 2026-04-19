const fs = require('fs');
let html = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_player.html', 'utf8');

const scalingScript = `
        // ==========================================
        // LED PANEL AUTO-SCALING LOGIC (解像度/アスペクト比自動最適化)
        // ==========================================
        function applyPanelScaling() {
            const urlParams = new URLSearchParams(window.location.search);
            // URLパラメータ ?panel=fish 等か、LocalStorageから取得。デフォルトは通常画面
            const panelType = urlParams.get('panel') || localStorage.getItem('retail_panel_type') || 'normal';
            
            const vid = document.getElementById('video-screen');
            const img = document.getElementById('image-screen');
            const yt = document.getElementById('yt-player-container');
            
            // デフォルト（通常の16:9フルスクリーン）
            let cssText = "width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;";
            
            // 特殊LEDフィルムの解像度ハードコーディング
            if (panelType === 'fish') {
                // 鮮魚対面ガラス 1000 x 300
                cssText = "position:absolute; top:0; left:0; width:1000px; height:300px; object-fit:cover;";
                console.log("[Scaler] 鮮魚対面ガラスモード (1000x300) を適用しました。");
            } else if (panelType === 'fridge') {
                // 冷蔵庫ドア 500 x 1000
                cssText = "position:absolute; top:0; left:0; width:500px; height:1000px; object-fit:cover;";
                console.log("[Scaler] 冷蔵庫ドアモード (500x1000) を適用しました。");
            } else if (panelType === 'endcap') {
                // エンド上部 900 x 200
                cssText = "position:absolute; top:0; left:0; width:900px; height:200px; object-fit:cover;";
                console.log("[Scaler] エンド上部モード (900x200) を適用しました。");
            } else if (panelType === 'shelf') {
                // 棚割り（定番棚） 900 x 100
                cssText = "position:absolute; top:0; left:0; width:900px; height:100px; object-fit:cover;";
                console.log("[Scaler] 棚割り(電子棚札)モード (900x100) を適用しました。");
            }
            
            // LEDパネルから外れた不要な領域が発光しないように背景を真っ黒にする
            document.body.style.backgroundColor = "black";
            if (vid) vid.style.cssText = cssText;
            if (img) img.style.cssText = cssText;
            if (yt) yt.style.cssText = cssText;
        }
        
        document.addEventListener('DOMContentLoaded', applyPanelScaling);
`;

if (!html.includes('LED PANEL AUTO-SCALING LOGIC')) {
    html = html.replace('</head>', `    <script>\n${scalingScript}\n    </script>\n</head>`);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_player.html', html, 'utf8');
    console.log('Scaling logic injected to signage_player.html!');
} else {
    console.log('Scaling logic already attached!');
}
