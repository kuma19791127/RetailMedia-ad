const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', 'utf8');

// 1. Fetch & Sync State methods
const syncApiLogic = `        async function fetchManualState() {
            try {
                const res = await fetch('/api/manualhelp/state');
                const data = await res.json();
                if(data.success && data.state) {
                    if (data.state.manuals && data.state.manuals.length > 0) {
                        dbManuals = data.state.manuals;
                        localStorage.setItem('ag_manuals', JSON.stringify(dbManuals));
                    }
                    if (data.state.logs && data.state.logs.length > 0) {
                        adminLogs = data.state.logs;
                        localStorage.setItem('ag_logs', JSON.stringify(adminLogs));
                    }
                    if(window.location.hash.includes('db')) renderAdminLogs();
                    if(window.location.hash.includes('auth')) renderUserManuals();
                }
            } catch(e) {}
        }
        
        async function syncManualState() {
            try {
                await fetch('/api/manualhelp/state', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ manuals: dbManuals, logs: adminLogs })
                });
            } catch(e) {}
        }`;

if(!doc.includes('async function syncManualState()')) {
    doc = doc.replace('function loadDB() {', syncApiLogic + '\n\n        function loadDB() {');
}

// 2. Call fetchManualState on boot
const onloadTarget = `            await fetchManualChat();`;
if(doc.includes(onloadTarget) && !doc.includes('await fetchManualState()')) {
    doc = doc.replace(onloadTarget, onloadTarget + `\n            await fetchManualState();`);
}

// 3. Inject sync into saveDB()
const saveDbTarget = `function saveDB() {
            localStorage.setItem('ag_manuals', JSON.stringify(dbManuals));
            localStorage.setItem('ag_logs', JSON.stringify(adminLogs));`;
const saveDbRepl = `function saveDB() {
            localStorage.setItem('ag_manuals', JSON.stringify(dbManuals));
            localStorage.setItem('ag_logs', JSON.stringify(adminLogs));
            syncManualState();`;
if(doc.includes(saveDbTarget) && !doc.includes('syncManualState();\n            localStorage.setItem(\'ag_chat\'')) {
    doc = doc.replace(saveDbTarget, saveDbRepl);
}

// 4. Update saveManual() to store a snapshot
// I must capture a deep copy BEFORE updating `m`.
const modifyManualTarget = `            const diffResult = diffTexts.join(" / ");

            m.name = newName;
            m.desc = newDesc;
            m.steps = tempSteps;
            m.version += 1;
            
            adminLogs.unshift({ vid: \`v1.0.\${m.version}\`, manual: m.name, user: currentUser ? currentUser.name : "企業管理者", time: dateStr, diff: diffResult });`;

const modifyManualRepl = `            const diffResult = diffTexts.join(" / ");

            // Save snapshot of OLD state
            const snapshot = JSON.parse(JSON.stringify(m));

            m.name = newName;
            m.desc = newDesc;
            m.steps = tempSteps;
            m.version += 1;
            
            adminLogs.unshift({ vid: \`v1.0.\${m.version}\`, manual: m.name, user: currentUser ? currentUser.name : "企業管理者", time: dateStr, diff: diffResult, snapshot: snapshot });`;

if(doc.includes(modifyManualTarget) && !doc.includes('snapshot: snapshot')) {
    doc = doc.replace(modifyManualTarget, modifyManualRepl);
}

// 5. Render Revert button and Implement Revert logic
const renderLogsTarget = `        function renderAdminLogs() {
            const tbody = document.getElementById('admin-log-data');
            tbody.innerHTML = '';
            adminLogs.forEach(log => {
                tbody.innerHTML += \`<tr><td><span class="badge">\${log.vid}</span></td><td>\${log.manual}</td><td style="color:#cbd5e1;">\${log.user}</td><td style="color:#cbd5e1;">\${log.time}</td><td>\${log.diff}</td></tr>\`;
            });
        }`;

const renderLogsRepl = `        function revertManualLog(idx) {
            const log = adminLogs[idx];
            if (!log.snapshot) return Swal.fire('エラー', 'このログには復元用スナップショットデータがありません', 'error');

            Swal.fire({
                title: 'バージョン復元',
                text: \`本当に「\${log.manual}」を \${log.vid} 以前の状態（\${log.time}のデータ）へ元に戻しますか？\`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'はい、復元する'
            }).then(result => {
                if(result.isConfirmed) {
                    let mIdx = dbManuals.findIndex(m => m.id === log.snapshot.id);
                    if(mIdx > -1) {
                        dbManuals[mIdx] = JSON.parse(JSON.stringify(log.snapshot));
                        dbManuals[mIdx].version += 1; // Bump version for the newly restored state
                        
                        // Formulate Date
                        const now = new Date();
                        const dateStr = now.getFullYear() + '/' + (now.getMonth() + 1).toString().padStart(2, '0') + '/' + now.getDate().toString().padStart(2, '0') + ' ' + now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                        
                        adminLogs.unshift({ vid: \`v1.0.\${dbManuals[mIdx].version}\`, manual: dbManuals[mIdx].name, user: currentUser ? currentUser.name : "システム管理者", time: dateStr, diff: "タイムマシンによるバージョン復元", snapshot: null });
                        saveDB();
                        renderAdminLogs();
                        renderDB();
                        Swal.fire('復元完了', 'マニュアルの構成を過去の状態に巻き戻しました', 'success');
                    } else {
                        Swal.fire('エラー', '対象のマニュアルが見つかりません', 'error');
                    }
                }
            });
        }

        function renderAdminLogs() {
            const tbody = document.getElementById('admin-log-data');
            tbody.innerHTML = '';
            adminLogs.forEach((log, idx) => {
                let revertBtn = log.snapshot ? \`<button onclick="revertManualLog(\${idx})" style="padding:4px 8px; border:none; border-radius:4px; background:#f59e0b; color:white; cursor:pointer; font-size:0.75rem;"><i class="fa-solid fa-clock-rotate-left"></i> 復元</button>\` : '<span style="font-size:0.75rem; color:#666;">不可</span>';
                tbody.innerHTML += \`<tr><td><span class="badge">\${log.vid}</span></td><td>\${log.manual}</td><td style="color:#cbd5e1;">\${log.user}</td><td style="color:#cbd5e1;">\${log.time}</td><td>\${log.diff}</td><td style="text-align:center;">\${revertBtn}</td></tr>\`;
            });
        }`;

if(doc.includes(renderAdminLogsTarget)) // typo catch, let's use indexOf
    doc = doc.replace(renderLogsTarget, renderLogsRepl);
else if(doc.indexOf("function renderAdminLogs()") !== -1) {
    const splitArr = doc.split("function renderAdminLogs() {");
    const closingIdx = splitArr[1].indexOf("}");
    const fullLog = "function renderAdminLogs() {" + splitArr[1].substring(0, closingIdx + 1);
    doc = doc.replace(fullLog, renderLogsRepl);
}

// 6. Fix the table headers in DB view to include "復元" (Revert) column
const thTarget = `<th>バージョン</th><th>対象マニュアル</th><th>編集者</th><th>時間</th><th>変更内容</th>`;
const thRepl = `<th>バージョン</th><th>対象マニュアル</th><th>編集者</th><th>時間</th><th>変更内容</th><th>タイムマシン</th>`;
if(doc.includes(thTarget)) {
    doc = doc.replace(thTarget, thRepl);
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', doc, 'utf8');
console.log("Patched Time Machine logic into manualhelp.html");
