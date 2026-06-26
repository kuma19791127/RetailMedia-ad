import os

def list_files():
    path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\scratch\excel_dump.txt"
    if not os.path.exists(path):
        print("File not found:", path)
        return
        
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if line.startswith("FILE:") or line.startswith("FILE"):
                print(line.strip())

if __name__ == "__main__":
    list_files()
