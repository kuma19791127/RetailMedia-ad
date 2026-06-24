import json
import os
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

log_path = r"C:\Users\one\.gemini\antigravity\brain\be2fc2ef-68df-4715-bc64-e347bd39449b\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print(f"Log file not found: {log_path}")
    sys.exit(1)

print(f"Searching log file: {log_path}")
count = 0
with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line_idx, line in enumerate(f, start=1):
        try:
            data = json.loads(line)
            content = data.get('content', '')
            # If content contains NAT (case-insensitive)
            if 'nat' in content.lower():
                # Check if it contains some drawing characters like --> or | or +-- or graph or code block
                has_diagram = any(x in content for x in ["-->", "|", "+--", "graph ", "flowchart", "```mermaid", "──", "┌", "└"])
                if has_diagram or 'gateway' in content.lower():
                    print(f"\n=========================================\nMatch at Line {line_idx} (Type: {data.get('type')}, Source: {data.get('source')}):")
                    # Find where 'nat' or diagram characters are, and print that section
                    print(content)
                    count += 1
        except Exception as e:
            pass

print(f"\nTotal matches with diagrams: {count}")
