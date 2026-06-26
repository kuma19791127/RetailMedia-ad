import os

def search_dump():
    path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\scratch\excel_dump.txt"
    if not os.path.exists(path):
        print("File not found:", path)
        return
        
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        
    keywords = ["事業者接続試験", "認可", "残高照会", "振込依頼"]
    matches = []
    
    current_file = ""
    for idx, line in enumerate(lines):
        if line.startswith("FILE:"):
            current_file = line.strip()
        if any(kw in line for kw in keywords):
            start = max(0, idx - 5)
            end = min(len(lines), idx + 6)
            block = f"--- Match in {current_file} (Line {idx+1}) ---\n" + "".join(lines[start:end])
            matches.append(block)
            
    output_path = "excel_dump_matches.txt"
    with open(output_path, "w", encoding="utf-8") as out:
        out.write("\n\n" + "="*80 + "\n\n").join(matches[:100]) # 最大100件
        
    print(f"Done. Found {len(matches)} matches. Saved to {output_path}")

if __name__ == "__main__":
    # ジョイン処理のバグを回避するため修正
    # matchesの連結部分を直す
    path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\scratch\excel_dump.txt"
    if not os.path.exists(path):
        print("File not found:", path)
        sys.exit(1)
        
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        
    keywords = ["事業者接続試験", "認可", "残高照会", "振込依頼"]
    matches = []
    
    current_file = ""
    for idx, line in enumerate(lines):
        if line.startswith("FILE:") or line.startswith("FILE"):
            current_file = line.strip()
        if any(kw in line for kw in keywords):
            start = max(0, idx - 5)
            end = min(len(lines), idx + 6)
            block = f"--- Match in {current_file} (Line {idx+1}) ---\n" + "".join(lines[start:end])
            matches.append(block)
            
    output_path = "excel_dump_matches.txt"
    with open(output_path, "w", encoding="utf-8") as out:
        out.write(("\n\n" + "="*80 + "\n\n").join(matches[:100]))
        
    print(f"Done. Found {len(matches)} matches. Saved to {output_path}")
