const fs = require('fs');

let doc = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', 'utf8');

// 1. Fix doLogin to utilize data.user
const loginTarget = `                if (data.success) {
                    sessionStorage.setItem('retailMediaAuth', 'true');
                    currentUser = { org, name, email, role, avatar: name.charAt(0) };`;
const loginRepl = `                if (data.success) {
                    sessionStorage.setItem('retailMediaAuth', 'true');
                    const realName = data.user && data.user.name ? data.user.name : name;
                    const realOrg = data.user && data.user.org ? data.user.org : org;
                    currentUser = { org: realOrg, name: realName, email, role, avatar: realName.charAt(0) };`;

if(doc.includes(loginTarget)) {
    doc = doc.replace(loginTarget, loginRepl);
}

// 2. Fetch and Sync functions
const fetchFunctions = `
        async function fetchManualChat() {
            try {
                const res = await fetch('/api/manualhelp/chat');
                const data = await res.json();
                if(data.success && data.chat && data.chat.length > 0) {
                    chatMessages = data.chat;
                    localStorage.setItem('ag_chat', JSON.stringify(chatMessages));
                    if(window.location.hash.includes('chat')) renderChat();
                }
            } catch(e) {}
        }
        
        async function syncManualChat() {
            try {
                await fetch('/api/manualhelp/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat: chatMessages })
                });
            } catch(e) {}
        }
`;

const loadDbTarget = `function loadDB() {`;
if(!doc.includes('async function fetchManualChat()')) {
    doc = doc.replace(loadDbTarget, fetchFunctions + '\n        ' + loadDbTarget);
}

// 3. Initialize fetch on boot
const onloadTarget = `        window.onload = function() {
            checkRoute();
            initSquarePayments();
        };`;
const onloadRepl = `        window.onload = async function() {
            checkRoute();
            initSquarePayments();
            await fetchManualChat();
        };`;
if(doc.includes(onloadTarget)) {
    doc = doc.replace(onloadTarget, onloadRepl);
}

// 4. Override saveDB to push chat to backend
const saveDbTarget = `localStorage.setItem('ag_chat', JSON.stringify(chatMessages));`;
const saveDbRepl = `localStorage.setItem('ag_chat', JSON.stringify(chatMessages));\n            syncManualChat();`;
// To prevent duplicate replace:
if(doc.includes(saveDbTarget) && !doc.includes('syncManualChat();')) {
    // We only want to replace inside saveDB, but also inside sendChat if they directly push.
    // I'll replace globally:
    doc = doc.replace(/localStorage\.setItem\('ag_chat', JSON\.stringify\(chatMessages\)\);/g, saveDbRepl);
}

// 5. In checkRoute, also if logged in, might want to fetch chat (already done in onload).
// Ensure sendChat immediately pushes to backend.
// In sendChat, it doesn't call saveDB, it just relies on it? Wait let's check manually.
const sendChatTarget = `            chatMessages.push({ id: Date.now(), org: u.org, sender: u.name, target: currentChannel, avatar: u.avatar, color: '#10b981', time: "今", text: txt, file: pendingFile });
            document.getElementById('chat-input').value = ''; removePendingFile(); document.getElementById('mention-hint').style.display='none';
            renderChat();`;
const sendChatRepl = `            chatMessages.push({ id: Date.now(), org: u.org, sender: u.name, target: currentChannel, avatar: u.avatar, color: '#10b981', time: "今", text: txt, file: pendingFile });
            document.getElementById('chat-input').value = ''; removePendingFile(); document.getElementById('mention-hint').style.display='none';
            localStorage.setItem('ag_chat', JSON.stringify(chatMessages));
            syncManualChat();
            renderChat();`;
if(doc.includes(sendChatTarget)) {
    doc = doc.replace(sendChatTarget, sendChatRepl);
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/manualhelp.html', doc, 'utf8');
console.log("Patched frontend manualhelp for auth logic & cloud chat");
