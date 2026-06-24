import codecs

def verify_html_tags(filepath):
    print(f"Verifying {filepath}...")
    with codecs.open(filepath, 'r', 'utf-8') as f:
        content = f.read()

    tags_to_check = ['script', 'div', 'form', 'html']
    has_errors = False

    for tag in tags_to_check:
        open_count = len(content.lower().split(f"<{tag}")) - 1
        close_count = len(content.lower().split(f"</{tag}>")) - 1
        print(f"Tag <{tag}>: open={open_count}, close={close_count}")
        if open_count != close_count:
            print(f"  [ERROR] Tag mismatch for <{tag}>! open={open_count}, close={close_count}")
            has_errors = True
        else:
            print(f"  [OK] Matched.")

    # Check file end
    trimmed_end = content.strip().lower()
    if trimmed_end.endswith("</html>"):
        print("  [OK] File ends with </html>")
    else:
        print(f"  [WARNING] File ends with: {trimmed_end[-20:]}")
        has_errors = True

    if has_errors:
        print("[FAIL] Integrity checks failed.")
    else:
        print("[SUCCESS] All tag count and file end integrity checks passed.")

if __name__ == "__main__":
    verify_html_tags("shift_manager.html")
