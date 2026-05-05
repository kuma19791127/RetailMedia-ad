import os
import re

fp = 'c:/Users/one/Desktop/RetailMedia_System/manualhelp.html'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

old_render_chat = """        function renderChat() {
            const myOrg = currentUser ? currentUser.org : '未所属';
            const myName = currentUser ? currentUser.name : '';
            
            // Generate user list dynamically based on chat history for this organization
            const uniqueUsers = new Set(['熊澤', '森下', '店長']); // Default demo users
            chatMessages.forEach(m => {
                if(m.org === myOrg && m.sender !== myName && m.sender !== '本部') uniqueUsers.add(m.sender);
            });
            const users = Array.from(uniqueUsers);

            let chanHtml = `<div class="chat-item ${currentChannel==='全体連絡'?'active':''}" onclick="switchChannel('全体連絡')"><div class="chat-avatar" style="background:#f43f5e;"><i class="fa-solid fa-bullhorn"></i></div> <div>@全体連絡</div></div>`;
            users.forEach(u => {
                chanHtml += `<div class="chat-item ${currentChannel===u?'active':''}" onclick="switchChannel('${u}')"><div class="chat-avatar" style="background:#8b5cf6;">👤</div> <div>@${u}</div></div>`;
            });
            document.getElementById('channel-list').innerHTML = chanHtml;"""

new_render_chat = """        async function renderChat() {
            const myOrg = currentUser ? currentUser.org : '未所属';
            const myName = currentUser ? currentUser.name : '';
            
            const uniqueUsers = new Set(['熊澤', '森下', '店長']); // Default demo users
            
            // Try fetching real users from backend
            try {
                const res = await fetch('/api/auth/users');
                const data = await res.json();
                if (data.success && data.users) {
                    data.users.forEach(u => {
                        if (u.name && u.name !== myName && (u.org === myOrg || u.org === 'Demo Corp')) {
                            uniqueUsers.add(u.name);
                        }
                    });
                }
            } catch(e) { console.error('Failed to fetch users', e); }

            // Add users from chat history just in case
            chatMessages.forEach(m => {
                if(m.org === myOrg && m.sender !== myName && m.sender !== '本部') uniqueUsers.add(m.sender);
            });
            const users = Array.from(uniqueUsers);

            let chanHtml = `<div class="chat-item ${currentChannel==='全体連絡'?'active':''}" onclick="switchChannel('全体連絡')"><div class="chat-avatar" style="background:#f43f5e;"><i class="fa-solid fa-bullhorn"></i></div> <div>@全体連絡</div></div>`;
            users.forEach(u => {
                chanHtml += `<div class="chat-item ${currentChannel===u?'active':''}" onclick="switchChannel('${u}')"><div class="chat-avatar" style="background:#8b5cf6;">👤</div> <div>@${u}</div></div>`;
            });
            const cList = document.getElementById('channel-list');
            if(cList) cList.innerHTML = chanHtml;"""

content = content.replace(old_render_chat, new_render_chat)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated renderChat in manualhelp.html")
