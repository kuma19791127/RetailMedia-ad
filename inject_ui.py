import codecs

# 1. anywhere_retail.html - Add Agent Chat UI
with codecs.open('anywhere_retail.html', 'r', 'utf-8') as f:
    retail_content = f.read()

chat_ui = """
    <!-- AI Agent Chat Modal -->
    <div id="aiAgentModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>🤖 AI 広告運用エージェント</h2>
                <span class="close-btn" onclick="document.getElementById('aiAgentModal').style.display='none'">&times;</span>
            </div>
            <div class="modal-body">
                <p>キャンペーンの要望を自然言語で入力してください。</p>
                <textarea id="aiAgentInput" placeholder="例: 来週の火曜日から夏物飲料のキャンペーンを予算5万円でやりたい" style="width: 100%; height: 100px; padding: 10px; margin-bottom: 15px; border-radius: 8px; border: 1px solid var(--border);"></textarea>
                <button class="primary-btn" onclick="runAiAgent()" id="aiAgentBtn" style="width: 100%;"><i class="fas fa-magic"></i> エージェントに依頼する</button>
                
                <div id="aiAgentResult" style="margin-top: 20px; padding: 15px; background: rgba(0, 255, 136, 0.1); border-radius: 8px; display: none; white-space: pre-wrap; font-size: 0.9em; border: 1px solid var(--primary);"></div>
            </div>
        </div>
    </div>
    
    <script>
    async function runAiAgent() {
        const input = document.getElementById('aiAgentInput').value;
        const btn = document.getElementById('aiAgentBtn');
        const resultDiv = document.getElementById('aiAgentResult');
        
        if(!input) return alert("指示を入力してください");
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> エージェントが分析・実行中...';
        btn.disabled = true;
        resultDiv.style.display = 'none';
        
        try {
            const res = await fetch(window.API_BASE_URL + '/api/agent/ad-ops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, storeId: 'current_store' })
            });
            const data = await res.json();
            
            if(data.success) {
                resultDiv.innerHTML = data.message;
                resultDiv.style.display = 'block';
            } else {
                alert("エラー: " + data.error);
            }
        } catch(e) {
            alert("通信エラー: " + e.message);
        }
        
        btn.innerHTML = '<i class="fas fa-magic"></i> エージェントに依頼する';
        btn.disabled = false;
    }
    </script>
"""

if 'aiAgentModal' not in retail_content:
    # Insert right before </body>
    idx = retail_content.rfind('</body>')
    if idx != -1:
        retail_content = retail_content[:idx] + chat_ui + retail_content[idx:]
        
        # Add a floating button to open the modal
        fab = """
        <button onclick="document.getElementById('aiAgentModal').style.display='flex'" style="position: fixed; bottom: 30px; right: 30px; background: var(--primary); color: #000; border: none; border-radius: 50%; width: 60px; height: 60px; box-shadow: 0 4px 15px rgba(0,255,136,0.4); font-size: 24px; cursor: pointer; z-index: 1000;">
            <i class="fas fa-robot"></i>
        </button>
        """
        retail_content = retail_content[:idx] + fab + retail_content[idx:]
        
        with codecs.open('anywhere_retail.html', 'w', 'utf-8') as f:
            f.write(retail_content)
        print('Injected Agent UI into anywhere_retail.html')


# 2. shift_manager.html - Add Notification trigger
with codecs.open('shift_manager.html', 'r', 'utf-8') as f:
    shift_content = f.read()

shift_ui = """
    <div style="margin: 20px 0;">
        <button class="action-btn" onclick="runShiftAgent()" style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border: 1px solid var(--primary); color: var(--primary);">
            <i class="fas fa-robot"></i> AIマニュアル自律連動をテスト実行
        </button>
    </div>
    <script>
    async function runShiftAgent() {
        try {
            alert("AIが明日のシフトを分析し、新人スタッフに最適なマニュアルを通知します...");
            const res = await fetch(window.API_BASE_URL + '/api/agent/shift-manual-sync', { method: 'POST' });
            const data = await res.json();
            if(data.success) {
                alert("通知完了！\\n推奨マニュアルID: " + data.result.recommendedManualId + "\\n理由: " + data.result.reason);
            } else {
                alert("エラー: " + data.error);
            }
        } catch(e) {
            alert("通信エラー");
        }
    }
    </script>
"""

if 'runShiftAgent' not in shift_content:
    # Insert somewhere in the main content area
    idx = shift_content.find('<div class="action-bar">')
    if idx != -1:
        shift_content = shift_content[:idx] + shift_ui + shift_content[idx:]
        with codecs.open('shift_manager.html', 'w', 'utf-8') as f:
            f.write(shift_content)
        print('Injected Agent UI into shift_manager.html')

