const fs = require('fs');
let sm = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/shift_manager.html', 'utf8');

const tSearch = `        async function editTime(deptId, day, idx) {
            const obj = currentShifts[deptId][day][idx];
            const { value: time } = await Swal.fire({
                title: '出退勤・編集',
                input: 'text',
                inputValue: obj.time,
                showCancelButton: true
            });
            if (time) {
                obj.time = time;
                renderBoard();
            }
        }`;

const tRepl = `        async function editTime(deptId, day, idx) {
            const obj = currentShifts[deptId][day][idx];
            const { value: time } = await Swal.fire({
                title: '出退勤・編集',
                input: 'text',
                inputValue: obj.time,
                showCancelButton: true
            });
            if (time) {
                obj.time = time;
                // Persistent save into STAFF so it reflects in calendar
                let s = STAFF.find(st => st.name === obj.name);
                if(s) {
                    if(!s.customTimes) s.customTimes = {};
                    s.customTimes[day] = time; // stores the override for that week day
                    saveStaffDB();
                }
                renderBoard();
            }
        }`;

if(sm.includes(tSearch)) {
    sm = sm.replace(tSearch, tRepl);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/shift_manager.html', sm, 'utf8');
}

console.log("Patched editTime persistence");
