import codecs

with codecs.open('shift_manager.html', 'r', 'utf-8') as f:
    shift_content = f.read()

shift_ui = """
    <div style="margin: 20px; padding: 15px; background: rgba(0,255,136,0.1); border: 1px solid var(--primary); border-radius: 8px;">
        <h3 style="margin-top:0;">🤖 AI エージェント（シフト・マニュアル連動テスト）</h3>
        <p style="font-size: 0.9em; margin-bottom: 15px;">明日のシフトに新人がいるか判定し、最適なマニュアルを通知します。</p>
        <button class="primary-btn" onclick="runShiftAgent()" style="width:100%;"><i class="fas fa-magic"></i> マニュアル自律配信を実行</button>
    </div>
    <script>
    async function runShiftAgent() {
        try {
            const btn = event.currentTarget;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AIが分析中...';
            btn.disabled = true;
            
            const res = await fetch(window.API_BASE_URL + '/api/agent/shift-manual-sync', { method: 'POST' });
            const data = await res.json();
            
            if(data.success) {
                alert("【通知完了】\\nAIがマニュアルを選択しました！\\nマニュアル: " + data.result.recommendedManualId + "\\n理由: " + data.result.reason);
            } else {
                alert("エラー: " + data.error);
            }
            btn.innerHTML = '<i class="fas fa-magic"></i> マニュアル自律配信を実行';
            btn.disabled = false;
        } catch(e) {
            alert("通信エラー");
        }
    }
    </script>
"""

idx = shift_content.find('<div class="main-content">')
if idx == -1:
    idx = shift_content.find('<body>') + 6

shift_content = shift_content[:idx] + shift_ui + shift_content[idx:]

with codecs.open('shift_manager.html', 'w', 'utf-8') as f:
    f.write(shift_content)

print('Injected into shift_manager.html')
