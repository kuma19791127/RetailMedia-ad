import os

file_path = r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\server_retail_dist.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to LF
original_ending = "\r\n" if "\r\n" in content else "\n"
content_lf = content.replace("\r\n", "\n")

target = """const getDatabaseRole = (role) => {
    return role || 'store';
};"""

replacement = """const getDatabaseRole = (role) => {
    if (role === 'corp' || role === 'employee') {
        return 'store';
    }
    return role || 'store';
};"""

count = content_lf.count(target)
print(f"Target count in server_retail_dist.js: {count}")

if count == 1:
    content_lf = content_lf.replace(target, replacement)
    final_content = content_lf.replace("\n", original_ending)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print("SUCCESS: server_retail_dist.js updated!")
else:
    print("ERROR: Target function pattern not found exactly once in server_retail_dist.js")
