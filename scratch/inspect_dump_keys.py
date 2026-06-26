import os

def inspect():
    path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\scratch\excel_dump.txt"
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        
    for idx, line in enumerate(lines):
        # FILE という文字列が含まれる行を探し、そのファイルサイズやシート名のあたりを10行表示
        if "FILE" in line:
            print(f"Line {idx+1}: {line.strip()}")
            for i in range(1, 10):
                if idx + i < len(lines):
                    print(f"  + {lines[idx+i].strip()}")
            print("-" * 50)

if __name__ == "__main__":
    inspect()
