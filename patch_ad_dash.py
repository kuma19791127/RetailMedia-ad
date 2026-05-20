import codecs

with codecs.open('ad_dashboard.html', 'r', 'utf-8') as f:
    text = f.read()

target = "if (res.ok) {"
replace = """if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || 'API Error: ' + res.status);
                    }
                    if (res.ok) {"""

# Replace only the first occurrence after fetch('/api/campaigns
idx = text.find("fetch(`${API_URL}/api/campaigns`")
if idx != -1:
    target_idx = text.find(target, idx)
    if target_idx != -1:
        text = text[:target_idx] + replace + text[target_idx + len(target):]
        with codecs.open('ad_dashboard.html', 'w', 'utf-8') as f:
            f.write(text)
        print("Patched ad_dashboard.html")
    else:
        print("Target not found")
else:
    print("Fetch not found")
