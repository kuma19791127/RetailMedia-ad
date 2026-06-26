import json
import os
import sys

brain_dir = r"C:\Users\one\.gemini\antigravity\brain"
output_file = r"C:\Users\one\.gemini\antigravity\playground\twilight-parsec\scratch\gmo_search_results.txt"

found = []

# すべての会話ログから、最近（特に6月25日頃）のGMOテストに関連する発言やコマンド実行を検索
for folder in os.listdir(brain_dir):
    folder_path = os.path.join(brain_dir, folder)
    if not os.path.isdir(folder_path):
        continue
    
    log_file = os.path.join(folder_path, ".system_generated", "logs", "transcript.jsonl")
    if not os.path.exists(log_file):
        continue
        
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for idx, line in enumerate(f, start=1):
            try:
                data = json.loads(line)
                content = data.get('content', '')
                content_lower = content.lower()
                
                # GMOテストに関する情報を探す
                # 特に、gmo が含まれ、かつ「テスト」や「接続試験」「/api/bank」「payout」などが含まれるもの
                if 'gmo' in content_lower:
                    # 昨日の日付（2026-06-25）が含まれているか、またはテストの実行らしきもの
                    # test_gmo や test_gmo_integration.js の実行ログなど
                    is_relevant = False
                    if '2026-06-25' in line or '2026-06-26' in line:
                        is_relevant = True
                    elif 'test_gmo' in content_lower or '事業者接続試験' in content_lower or '/api/bank' in content_lower:
                        is_relevant = True
                        
                    if is_relevant:
                        found.append({
                            'conv_id': folder,
                            'line': idx,
                            'type': data.get('type'),
                            'source': data.get('source'),
                            'content': content
                        })
            except Exception:
                pass

with open(output_file, 'w', encoding='utf-8') as outf:
    outf.write(f"Found {len(found)} matches.\n")
    for item in found:
        outf.write("\n" + "="*80 + "\n")
        outf.write(f"Conv ID: {item['conv_id']} | Line: {item['line']} | Type: {item['type']} | Source: {item['source']}\n")
        outf.write("-" * 80 + "\n")
        # 出力を1000文字以内に制限して見やすくする
        outf.write(item['content'][:1500])
        if len(item['content']) > 1500:
            outf.write("\n... [TRUNCATED] ...\n")
        outf.write("\n")

print(f"Results written to {output_file}. Matches: {len(found)}")
