import os

def search_freee():
    path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\scratch\excel_dump.txt"
    if not os.path.exists(path):
        print("File not found:", path)
        return
        
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        
    keywords = ["freee", "接続試験", "結果", "エビデンス", "実施日"]
    matches = []
    
    current_file = ""
    for idx, line in enumerate(lines):
        if line.startswith("FILE:") or line.startswith("FILE"):
            current_file = line.strip()
        # freeeの事業者接続試験などのシートがあるか探す
        if "freee" in line.lower() and "接続試験" in line:
            start = max(0, idx - 5)
            end = min(len(lines), idx + 20)
            block = f"--- Match in {current_file} (Line {idx+1}) ---\n" + "".join(lines[start:end])
            matches.append(block)
            
    output_path = "freee_dump_matches.txt"
    with open(output_path, "w", encoding="utf-8") as out:
        out.write(("\n\n" + "="*80 + "\n\n").join(matches[:50]))
        
    print(f"Done. Found {len(matches)} matches. Saved to {output_path}")

if __name__ == "__main__":
    search_freee()
