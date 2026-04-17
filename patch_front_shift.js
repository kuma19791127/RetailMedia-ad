const fs = require('fs');
let sm = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/shift_manager.html', 'utf8');

// 1. Backend Fetch & Save Overrides
const stateLogic = `
        async function fetchShiftState() {
            try {
                const res = await fetch('/api/shift/state');
                const data = await res.json();
                if(data.success && data.state) {
                    if(data.state.staff && data.state.staff.length > 0) STAFF = data.state.staff;
                    if(data.state.chatHistory && data.state.chatHistory.length > 0) chatHistory = data.state.chatHistory;
                }
            } catch(e) { }
        }

        async function syncShiftState(type) {
            try {
                await fetch('/api/shift/state', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(type === 'staff' ? { staff: STAFF } : { chatHistory: chatHistory })
                });
            } catch(e) { }
        }

        function saveStaffDB() {
            localStorage.setItem('shift_mgr_staff_db', JSON.stringify(STAFF));
            syncShiftState('staff');
        }
`;

if (!sm.includes('async function fetchShiftState()')) {
    sm = sm.replace('function saveStaffDB() {', stateLogic);
}

const appendChatLogic = `localStorage.setItem('shift_chat_history', JSON.stringify(chatHistory));\n                syncShiftState('chat');`;
sm = sm.replace(/localStorage\.setItem\('shift_chat_history', JSON\.stringify\(chatHistory\)\);/g, appendChatLogic);

const doLoginTarget = `sessionStorage.setItem('retailMediaAuth', 'true');
            } catch(e) {
                // Fallback
            }

            currentUser.org = orgNode.value;`;

if (sm.includes(doLoginTarget) && !sm.includes('await fetchShiftState();')) {
    sm = sm.replace(doLoginTarget, `sessionStorage.setItem('retailMediaAuth', 'true');
            } catch(e) {}
            
            await fetchShiftState();

            currentUser.org = orgNode.value;`);
}

// 2. Department Filtering in renderBoard()
// Find: DEPARTMENTS.forEach(dept => {
// We only render dept if it's currentUser.dept, UNLESS user is logged in as an admin or wants to see all. The user requested: "部門でログインしたら個別部門のシフトだけを表示"
const renderBoardTarget = `DEPARTMENTS.forEach(dept => {`;
const renderBoardRepl = `DEPARTMENTS.forEach(dept => {
                if (currentUser.email !== 'store@demo.com' && currentUser.email !== 'admin@demo.com' && dept.id !== currentUser.dept) return;`;

if (sm.includes(renderBoardTarget) && !sm.includes('dept.id !== currentUser.dept) return;')) {
    sm = sm.replace(renderBoardTarget, renderBoardRepl);
}

// Ensure Monthly View also isolates
const monthlyViewTarget = `function openMonthlyView(deptId) {`;
const monthlyViewRepl = `function openMonthlyView(deptId) {
            if (currentUser.email !== 'store@demo.com' && currentUser.email !== 'admin@demo.com' && deptId !== currentUser.dept) {
                deptId = currentUser.dept; // Force restriction
            }`;

if (sm.includes(monthlyViewTarget) && !sm.includes('Force restriction')) {
    sm = sm.replace(monthlyViewTarget, monthlyViewRepl);
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/shift_manager.html', sm, 'utf8');
console.log('Frontend Shift patched!');
