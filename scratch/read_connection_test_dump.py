import os

def read_connection_test():
    path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\scratch\excel_dump.txt"
    if not os.path.exists(path):
        print("File not found:", path)
        return
        
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        
    # Line 497 (1-indexedなので、インデックスは496)から、Line 661 までの内容を抽出
    block_lines = lines[496:661]
            
    output_path = "connection_test_dump_extracted.txt"
    with open(output_path, "w", encoding="utf-8") as out:
        out.write("".join(block_lines))
        
    print(f"Done. Extracted {len(block_lines)} lines. Saved to {output_path}")

if __name__ == "__main__":
    read_connection_test()
