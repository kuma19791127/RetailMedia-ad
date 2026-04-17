const fs = require('fs');
let sm = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/shift_manager.html', 'utf8');

// 1. Add admin to DEPARTMENTS array
const deptTarget = `{ id: 'bakery', name: '🍞 インストアベーカリー', req: { mon: 2, tue: 2, wed: 2, thu: 2, fri: 3, sat: 4, sun: 4 } }
        ];`;
const deptRepl = `{ id: 'bakery', name: '🍞 インストアベーカリー', req: { mon: 2, tue: 2, wed: 2, thu: 2, fri: 3, sat: 4, sun: 4 } },
            { id: 'admin', name: '👔 管理職 (店長等)', req: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 } }
        ];`;
if(sm.includes(deptTarget)) {
    sm = sm.replace(deptTarget, deptRepl);
}

// 2. Add to login select
const selectTarget = `<option value="bakery">🍞 ベーカリー</option>
            </select>`;
const selectRepl = `<option value="bakery">🍞 ベーカリー</option>
                <option value="admin">👔 管理職 (店長等)</option>
            </select>`;
if(sm.includes(selectTarget)) {
    sm = sm.replace(selectTarget, selectRepl);
}

// 3. Update isAdmin logic in renderBoard
const renderBoardTarget = `const isAdmin = currentUser.email.includes('store') || currentUser.email.includes('admin') || currentUser.role === 'admin';`;
const renderBoardRepl = `const isAdmin = currentUser.dept === 'admin';`;
if(sm.includes(renderBoardTarget)) {
    sm = sm.replace(renderBoardTarget, renderBoardRepl);
}

// 4. Update openMonthlyView check
const openMonthlyCheckTarget = `const isAdmin = currentUser.email && (currentUser.email.includes('store') || currentUser.email.includes('admin') || currentUser.role === 'admin');`;
const openMonthlyCheckRepl = `const isAdmin = currentUser.dept === 'admin';`;
if(sm.includes(openMonthlyCheckTarget)) {
    sm = sm.replace(openMonthlyCheckTarget, openMonthlyCheckRepl);
}

// 5. Remove '総労働時間' button and update '全従業員カレンダー' button condition
const buttonsTarget = `<button class="btn-generate" onclick="openTotalHours()" style="background:#0f172a; color:white;">⏱️
                    総労働時間 (管理者)</button>
                <button class="btn-generate" onclick="if(currentUser.role === 'admin' || currentUser.email.includes('store')){ openMonthlyView('all'); document.body.className = 'view-monthly'; } else { Swal.fire('エラー', '管理者権限が必要です', 'error'); }" style="background:#3b82f6; color:white;">📅 全従業員カレンダー(管理者)</button>`;
const buttonsRepl = `<button id="btn-admin-cal" class="btn-generate" onclick="if(currentUser.dept === 'admin'){ openMonthlyView('all'); document.body.className = 'view-monthly'; } else { Swal.fire('エラー', '管理者権限が必要です', 'error'); }" style="background:#3b82f6; color:white; display:none;">📅 全従業員カレンダー(管理職専用)</button>`;
if(sm.includes(buttonsTarget)) {
    sm = sm.replace(buttonsTarget, buttonsRepl);
}

// 6. Hook login to show/hide the button
const loginHookTarget = `document.getElementById('current-user-dept').innerText = DEPARTMENTS.find(d => d.id === currentUser.dept)?.name || '新規部門';`;
const loginHookRepl = `document.getElementById('current-user-dept').innerText = DEPARTMENTS.find(d => d.id === currentUser.dept)?.name || '新規部門';
            if (currentUser.dept === 'admin') {
                document.getElementById('btn-admin-cal').style.display = 'block';
            } else {
                if(document.getElementById('btn-admin-cal')) document.getElementById('btn-admin-cal').style.display = 'none';
            }`;
if(sm.includes(loginHookTarget)) {
    sm = sm.replace(loginHookTarget, loginHookRepl);
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/shift_manager.html', sm, 'utf8');
console.log('patched admin details');
