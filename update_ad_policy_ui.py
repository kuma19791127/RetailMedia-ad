# -*- coding: utf-8 -*-
import codecs
import re
import glob

new_policy_function = '''function showAdPolicy() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '配信・広告審査基準 (厳格化版)',
            html: `<div style="text-align:left; font-size:0.9rem; line-height:1.5; color:#333;">
                <p style="color:#e74c3c; font-weight:bold; margin-bottom:10px;">※サイネージでの詐欺被害を防ぐため、以下の項目が1つでも含まれる広告・動画はAIにより即時ブロック（アカウント停止）されます。</p>
                <ul style="padding-left:20px; margin-bottom:0;">
                    <li style="margin-bottom:8px;"><b>1. 架空請求・サポート詐欺:</b> 「未払い料金」「法的処置」「アカウント消去」「ウイルス感染」等で不安を煽る内容。</li>
                    <li style="margin-bottom:8px;"><b>2. 定期購入の隠蔽・点検詐欺:</b> 「初回無料」等と極端に安価を謳いつつ継続条件を隠す優良誤認広告や、不自然な格安修理業者。</li>
                    <li style="margin-bottom:8px;"><b>3. 暴力・攻撃的描写:</b> 流血の有無やフィクションに関係なく、殴打や威圧的な身体接触を含むもの。</li>
                    <li style="margin-bottom:8px;"><b>4. 投資詐欺・誇大広告:</b> 「確実に稼げる」等の表現、著名人の無断使用、安全性が確認できないQRコード・LINE誘導。</li>
                </ul>
            </div>`,
            icon: 'info',
            confirmButtonText: '確認しました',
            width: '600px'
        });
    } else {
        alert("【配信・広告審査基準】\n1. 架空請求・サポート詐欺\n2. 定期購入の隠蔽・格安点検詐欺\n3. 暴力・攻撃的描写\n4. 投資詐欺・危険なQRコード\nこれらを含むものはAIにより即時ブロックされます。");
    }
}'''

files_to_check = ['advertiser_dashboard.html', 'ad_dashboard.html', 'creator_portal.html', 'retailer_portal.html', 'store_portal.html']

for filepath in files_to_check:
    try:
        with codecs.open(filepath, 'r', 'utf-8') as f:
            content = f.read()
        
        # Regex to replace the entire showAdPolicy function
        # Matches from 'function showAdPolicy()' up to the matching closing brace.
        # Since regex for balanced braces is hard, we use a simpler pattern targeting the known structure.
        pattern = r'function\s+showAdPolicy\s*\(\)\s*\{[\s\S]*?(?:Swal\.fire\([\s\S]*?\);|alert\([\s\S]*?\);)\s*\}[\s\S]*?(?=\s*</script>|\s*function)'
        
        # Actually a safer way is to replace `function showAdPolicy() { ... }` up to `</script>` or another `function`.
        # Let's try to find the start and end indices manually to be safe.
        start_idx = content.find('function showAdPolicy()')
        if start_idx != -1:
            # find the next function or </script> after start_idx
            end_idx_1 = content.find('function ', start_idx + 20)
            end_idx_2 = content.find('</script>', start_idx)
            end_idx_3 = content.find('window.', start_idx)
            
            candidates = [i for i in [end_idx_1, end_idx_2, end_idx_3] if i != -1]
            if candidates:
                end_idx = min(candidates)
                
                # The function is from start_idx to end_idx. Wait, end_idx might be right after the closing brace.
                # Let's just find the closing brace before end_idx.
                sub_str = content[start_idx:end_idx]
                last_brace = sub_str.rfind('}')
                
                if last_brace != -1:
                    actual_end = start_idx + last_brace + 1
                    content = content[:start_idx] + new_policy_function + "\n" + content[actual_end:]
                    
                    with codecs.open(filepath, 'w', 'utf-8') as f:
                        f.write(content)
                    print(f"Updated {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
