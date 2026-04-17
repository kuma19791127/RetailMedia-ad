const fs = require('fs');

let sm = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/shift_manager.html', 'utf8');

// 1. Update openMonthlyView
const monthlyViewTarget = `            const dept = DEPARTMENTS.find(d => d.id === deptId);

            let tempMonthStart = new Date(currentDate);`;

const monthlyViewRepl = `            const dept = deptId === 'all' ? {name: '全従業員統合'} : DEPARTMENTS.find(d => d.id === deptId);

            let tempMonthStart = new Date(currentDate);`;

if(sm.includes(monthlyViewTarget)) {
    sm = sm.replace(monthlyViewTarget, monthlyViewRepl);
}

const monthlyViewStaffTarget = `                // Dynamically build cells for ALL real registered staff in this department
                let realStaffInDept = STAFF.filter(s => s.dept === deptId);`;

const monthlyViewStaffRepl = `                // Dynamically build cells for ALL real registered staff in this department
                let realStaffInDept = deptId === 'all' ? STAFF : STAFF.filter(s => s.dept === deptId);`;

if(sm.includes(monthlyViewStaffTarget)) {
    sm = sm.replace(monthlyViewStaffTarget, monthlyViewStaffRepl);
}

// 2. Add Button
const buttonTarget = `<button class="btn-generate" onclick="openTotalHours()" style="background:#0f172a; color:white;">⏱️
                    総労働時間 (管理者)</button>`;

const buttonRepl = `<button class="btn-generate" onclick="openTotalHours()" style="background:#0f172a; color:white;">⏱️
                    総労働時間 (管理者)</button>
                <button class="btn-generate" onclick="if(currentUser.role === 'admin' || currentUser.email.includes('store')){ openMonthlyView('all'); document.body.className = 'view-monthly'; } else { Swal.fire('エラー', '管理者権限が必要です', 'error'); }" style="background:#3b82f6; color:white;">📅 全従業員カレンダー(管理者)</button>`;

if(sm.includes(buttonTarget) && !sm.includes('全従業員カレンダー(管理者)')) {
    sm = sm.replace(buttonTarget, buttonRepl);
}

// 3. Admin view for active board
// If the user wants to see ALL shifts on the main weekly board as well.
// Wait, my previous patch hid the other departments visually.
// Let's ensure admin can see all departments.
// Previous patch: if (currentUser.email !== 'store@demo.com' && currentUser.email !== 'admin@demo.com' && dept.id !== currentUser.dept) return;
// Wait, `includes('store')` might be better or `role === admin`. 
const renderBoardTarget = `DEPARTMENTS.forEach(dept => {
                if (currentUser.email !== 'store@demo.com' && currentUser.email !== 'admin@demo.com' && dept.id !== currentUser.dept) return;`;

const renderBoardRepl = `DEPARTMENTS.forEach(dept => {
                const isAdmin = currentUser.email.includes('store') || currentUser.email.includes('admin') || currentUser.role === 'admin';
                if (!isAdmin && dept.id !== currentUser.dept) return;`;

if(sm.includes(renderBoardTarget)) {
    sm = sm.replace(renderBoardTarget, renderBoardRepl);
}

// Update openMonthlyView check
const openMonthlyViewCheckTarget = `            if (currentUser.email !== 'store@demo.com' && currentUser.email !== 'admin@demo.com' && deptId !== currentUser.dept) {
                deptId = currentUser.dept; // Force restriction
            }`;

const openMonthlyViewCheckRepl = `            const isAdmin = currentUser.email && (currentUser.email.includes('store') || currentUser.email.includes('admin') || currentUser.role === 'admin');
            if (deptId === 'all' && !isAdmin) deptId = currentUser.dept;
            if (!isAdmin && deptId !== currentUser.dept) {
                deptId = currentUser.dept; // Force restriction
            }`;

if(sm.includes(openMonthlyViewCheckTarget)) {
    sm = sm.replace(openMonthlyViewCheckTarget, openMonthlyViewCheckRepl);
}


fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/shift_manager.html', sm, 'utf8');
console.log('patched admin view');
