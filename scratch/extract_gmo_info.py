import re

def extract():
    path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\scratch\gmo_application_history.txt"
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # 「事業者接続試験」や「認可」「残高照会」などのキーワードが含まれる段落や周辺の文脈を検索する
    keywords = ["事業者接続試験", "接続試験", "認可", "トークン", "振込依頼結果照会", "残高照会", "テストID", "テスト結果"]
    
    # 行ごとに検索
    lines = content.splitlines()
    matches = []
    for idx, line in enumerate(lines):
        if any(kw in line for kw in keywords):
            # 周辺5行を含めて抽出
            start = max(0, idx - 3)
            end = min(len(lines), idx + 4)
            block = "\n".join([f"{i+1}: {lines[i]}" for i in range(start, end)])
            matches.append(block)
            
    # 重複や多すぎるマッチを避けるため、最大50個程度にする
    output = "\n\n---\n\n".join(matches[:50])
    with open("gmo_extracted.txt", "w", encoding="utf-8") as out:
        out.write(output)
    print(f"Extracted {len(matches)} matches. Saved to gmo_extracted.txt")

if __name__ == "__main__":
    extract()
