
const fs = require('fs');
let code = fs.readFileSync('manualhelp.html', 'utf8');

// Add category select in the edit modal
if (!code.includes('id="edit-manual-category"')) {
    code = code.replace(
        '<input type="text" id="edit-manual-name" placeholder="マニュアル名 (例: スーパーレジ担当)">',
        \<select id="edit-manual-category" style="width:100%; padding:15px; margin-bottom:10px; border-radius:8px; border:none; background:rgba(0,0,0,0.2); color:white; font-size:1rem; outline:none;">
    <option value="未分類">未分類</option>
    <option value="営業資料">営業資料</option>
    <option value="レジ操作">レジ操作</option>
    <option value="研修用">研修用</option>
    <option value="マニュアル">マニュアル</option>
</select>\n<input type="text" id="edit-manual-name" placeholder="マニュアル名 (例: スーパーレジ担当)">    );
}

// Update openEditManual to support category
code = code.replace(
    "document.getElementById('edit-manual-name').value = m.name;",
    "document.getElementById('edit-manual-name').value = m.name;\n    if(document.getElementById('edit-manual-category')) document.getElementById('edit-manual-category').value = m.category || '未分類';"
);

// Update saveEditManual to save category
code = code.replace(
    "m.name = document.getElementById('edit-manual-name').value;",
    "m.name = document.getElementById('edit-manual-name').value;\n    if(document.getElementById('edit-manual-category')) m.category = document.getElementById('edit-manual-category').value;"
);

// Group renderCreatorManuals by category
const newRenderCreator = function renderCreatorManuals() {
    const list = document.getElementById('manuals-list');
    list.innerHTML = '';
    
    // Group by category
    const grouped = {};
    dbManuals.forEach((m, idx) => {
        const cat = m.category || '未分類';
        if(!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({m, idx});
    });

    for(const cat in grouped) {
        list.innerHTML += \<div style="font-weight:bold; color:#38bdf8; margin: 15px 0 5px 0; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px;">📁 \</div>\;
        grouped[cat].forEach(item => {
            list.innerHTML += \<div class="manual-card" onclick="openEditManual(\)" style="margin-bottom:8px; padding:10px;"><div><h3 style="color:var(--primary); font-size:1.1rem; margin:0;">\</h3><p style="font-size:0.85rem; color:#cbd5e1; margin-top:5px;">\</p></div><i class="fa-solid fa-chevron-right"></i></div>\;
        });
    }
}
\;

code = code.replace(/function renderCreatorManuals\(\) \{[\s\S]*?\}\s*function createNewManual/m, newRenderCreator + "\nfunction createNewManual");

// Add button to AI Modal for PDF Parsing
if (!code.includes('parsePdfAi()') && code.includes('id="ai-source-modal"')) {
    code = code.replace(
        '<input type="file" id="excel-upload"',
        \<button class="btn" style="width:100%; background:#0f172a; border:1px solid #334155; justify-content:flex-start; padding:15px; margin-bottom:10px; text-align:left;" onclick="document.getElementById('ai-source-modal').style.display='none'; document.getElementById('pdf-ai-upload').click();">
    <i class="fa-solid fa-file-pdf" style="color:#ef4444; font-size:1.5rem; width:40px; text-align:center;"></i>
    <div style="flex:1;">
        <strong style="display:block; font-size:1rem; color:white;">PDF 自動階層化 (AI)</strong>
        <span style="font-size:0.75rem; color:#94a3b8;">目次を読み取ってステップへ自動分割します</span>
    </div>
</button>
<input type="file" id="pdf-ai-upload" accept="application/pdf" style="display:none;" onchange="handleAiPdf(event)">
<input type="file" id="excel-upload"    );
}

// Add handleAiPdf logic
if (!code.includes('async function handleAiPdf')) {
    code += \

async function handleAiPdf(e) {
    const file = e.target.files[0];
    if(!file) return;
    
    document.getElementById('ai-loading').style.display = 'block';
    document.getElementById('ai-status').innerHTML = 'AWS / Google AI<br><span style="font-size:0.8rem">PDFの目次を解析し階層化しています...</span>';
    
    try {
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64 = ev.target.result;
            const res = await fetch('/api/manualhelp/pdf-to-steps', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdf_base64: base64 })
            });
            const data = await res.json();
            document.getElementById('ai-loading').style.display = 'none';
            if(data.success) {
                const aiResult = data.result;
                if(aiResult.category) document.getElementById('edit-manual-category').value = aiResult.category;
                
                let addedSteps = 0;
                aiResult.steps.forEach(st => {
                    tempSteps.push({ title: st.title, desc: st.desc });
                    addedSteps++;
                });
                
                renderEditSteps();
                Swal.fire('解析成功', \個の目次チャプターを自動生成しました！<br>カテゴリ: [\]\, 'success');
            } else {
                Swal.fire('AIエラー', data.error || 'PDF解析に失敗しました', 'error');
            }
            document.getElementById('pdf-ai-upload').value = '';
        };
        reader.readAsDataURL(file);
    } catch(err) {
        document.getElementById('ai-loading').style.display = 'none';
        Swal.fire('エラー', '通信エラーが発生しました', 'error');
        document.getElementById('pdf-ai-upload').value = '';
    }
}
\;
}

fs.writeFileSync('manualhelp.html', code, 'utf8');
print("manualhelp.html patched with PDF AI feature");
