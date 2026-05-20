with open('retailer_portal.html', 'r', encoding='utf-8') as f:
    text = f.read()

insert_html = '''
                <div style="margin-bottom:20px; background:#f1f5f9; padding:15px; border-radius:8px; border-left:4px solid #3b82f6;">
                    <label style="font-weight:bold; color:#1e293b; display:flex; align-items:center; cursor:pointer;">
                        <input type="checkbox" id="enable-time-limit" style="margin-right:10px; width:18px; height:18px;">
                        動画の再生時間を最大120秒（2分）に制限する
                    </label>
                    <p style="margin:5px 0 0 28px; font-size:0.85rem; color:#64748b;">※チェックを外すと、動画が完了するまで制限なくフル再生されます（デフォルト推奨）</p>
                </div>
'''

target = '<div class="drop-zone" id="drop-zone" onclick="document.getElementById(\'file-input\').click()">'
text = text.replace(target, insert_html + '\n                ' + target)

with open('retailer_portal.html', 'w', encoding='utf-8') as f:
    f.write(text)
