const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', 'utf8');

const anchorTarget = `<h3 style="color:#fbbf24; font-size:1rem; margin-bottom:15px;"><i class="fa-solid fa-robot"></i> 高度なAI処理 <span style="font-size:0.8rem; background:#fbbf24; color:#0f172a; padding:2px 6px; border-radius:4px; margin-left:5px;">有料</span></h3>`;
const anchorRepl = `<h3 style="color:#fbbf24; font-size:1rem; margin-bottom:5px; display:inline-block;"><i class="fa-solid fa-robot"></i> 高度なAI処理 <span style="font-size:0.8rem; background:#fbbf24; color:#0f172a; padding:2px 6px; border-radius:4px; margin-left:5px;">有料</span></h3>
                            <div style="text-align: right; margin-bottom:15px;">
                                <a href="#" onclick="showAiDetails(); return false;" style="color:#60a5fa; font-size:0.85rem; text-decoration:underline; display:inline-flex; align-items:center; gap:4px;"><i class="fa-solid fa-circle-info"></i> 詳細はこちら</a>
                            </div>`;

if(doc.includes(anchorTarget) && !doc.includes("showAiDetails()")) {
    doc = doc.replace(anchorTarget, anchorRepl);
}

const jsInjectTarget = `        function showAiDetails() {`;
if(!doc.includes(jsInjectTarget)) {
    const fn = `
        function showAiDetails() {
            Swal.fire({
                title: '<i class="fa-solid fa-wand-magic-sparkles" style="color:#fbbf24;"></i> AI自動生成とは？',
                html: \`
                    <div style="text-align:left; font-size:0.85rem; line-height:1.6; color:#e2e8f0;">
                        <p style="margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px;">
                            Googleの最先端マルチモーダルAI<b>「Gemini 1.5 Flash」</b>の映像解析APIをバックエンドのNode.js経由で叩く、本物のAI連携機能です。
                        </p>
                        <h4 style="color:#f8fafc; font-size:1rem; margin-bottom:10px;"><i class="fa-solid fa-video"></i> 撮影した動画をアップロードするとどうなるか</h4>
                        <p style="margin-bottom:10px;">
                            たとえば店舗で「新しいレジの締め作業」や「コーヒーマシンの清掃方法」をスマホ動画で撮影しシステムに読み込ませると、以下の処理が自動実行されます。
                        </p>
                        
                        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; margin-bottom:10px;">
                            <strong style="color:#38bdf8;">1. AIが動画の意味を理解</strong>
                            <p style="margin:5px 0 0 0; color:#cbd5e1; font-size:0.8rem;">
                                動画データをAPIへ送信し、映像内の「人の手」「機械の変化」「音声」をAIが複合的に読み取ります。<br>
                                <span style="font-size:0.7rem; color:#94a3b8;">（※システム内部で「マニュアル作成者として行程を解析しJSONで出力せよ」とプロンプト制御しています）</span>
                            </p>
                        </div>

                        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; margin-bottom:15px;">
                            <strong style="color:#38bdf8;">2. 時系列のステップに自動分解</strong>
                            <p style="margin:5px 0 10px 0; color:#cbd5e1; font-size:0.8rem;">
                                AIが動画の中身を解釈し、「具体的な作業手順と説明文」を以下の様に自動でテキスト化・分割して返却します。
                            </p>
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <div style="background:#1e293b; padding:8px; border-radius:6px; border-left:4px solid #10b981;">
                                    <strong style="color:#10b981;">Step 1</strong><br>「マシンの給水タンク<br>を取り外す」
                                </div>
                                <div style="background:#1e293b; padding:8px; border-radius:6px; border-left:4px solid #10b981;">
                                    <strong style="color:#10b981;">Step 2</strong><br>「中性洗剤でタンクの<br>内側を洗う」
                                </div>
                                <div style="background:#1e293b; padding:8px; border-radius:6px; border-left:4px solid #10b981;">
                                    <strong style="color:#10b981;">Step 3</strong><br>「本体の電源を<br>長押ししてリセット」
                                </div>
                            </div>
                        </div>

                        <p style="color:#fbbf24; font-weight:bold; margin:0; text-align:center;">
                            管理者はAIが作った骨組みや文章を微修正するだけで、<br>高度なマニュアルがあっという間に完成します！
                        </p>
                    </div>
                \`,
                background: '#0f172a',
                color: '#f8fafc',
                confirmButtonText: '閉じる',
                width: 450
            });
        }
`;
    // Insert just before loadDB
    doc = doc.replace('        async function fetchManualChat() {', fn + '\n        async function fetchManualChat() {');
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', doc, 'utf8');
console.log('Added AI details modal to manualhelp.html');
