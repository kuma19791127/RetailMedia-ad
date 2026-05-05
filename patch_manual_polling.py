import os

fp = 'c:/Users/one/Desktop/RetailMedia_System/manualhelp.html'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

old_onload = '''        window.onload = async function() {
            checkRoute();
            initSquarePayments();
            await fetchManualChat();
            await fetchManualState();
        };'''

new_onload = '''        window.onload = async function() {
            checkRoute();
            initSquarePayments();
            await fetchManualChat();
            await fetchManualState();
            
            // リアルタイム更新用ポーリング (5秒毎)
            setInterval(async () => {
                if(window.location.hash.includes('chat')) {
                    await fetchManualChat();
                    renderChat();
                }
            }, 5000);
        };'''

content = content.replace(old_onload, new_onload)

# The Apple Pay warning is a console.warn that we can suppress
content = content.replace('console.warn("Apple Payの初期化に失敗、またはドメイン未認証", e);', '/* Apple Pay not supported on this browser */')

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated manualhelp.html polling and suppressed Apple Pay warning")
