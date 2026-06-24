import json
import os
import sys

brain_dir = r"C:\Users\one\.gemini\antigravity\brain"
output_file = r"C:\Users\one\.gemini\antigravity\playground\twilight-parsec\scratch\diagram_search_results.txt"

found = []

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
                
                # We want diagrams that explain NAT Gateway + App Runner + GMO
                if 'nat' in content_lower and 'apprunner' in content_lower and ('gmo' in content_lower or 'aozora' in content_lower):
                    has_arrow = '-->' in content or '──>' in content or '│' in content or '┌' in content or 'graph ' in content_lower or 'flowchart' in content_lower
                    if has_arrow:
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
    outf.write(f"Found {len(found)} strict matches.\n")
    for item in found:
        outf.write("\n" + "="*80 + "\n")
        outf.write(f"Conv ID: {item['conv_id']} | Line: {item['line']} | Type: {item['type']} | Source: {item['source']}\n")
        outf.write("-" * 80 + "\n")
        outf.write(item['content'])
        outf.write("\n")

print(f"Strict results written to {output_file}. Matches: {len(found)}")
