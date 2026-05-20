import codecs
import re

with codecs.open('creator_portal.html', 'r', 'utf-8') as f:
    text = f.read()

target = """fetch(`${API_BASE}/api/creator/upload`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: formValues.title,
                            src: formValues.fileUrl,
                            format: formValues.format,
                            isAd: formValues.isAd
                        })
                    })"""

replace = """fetch(`${API_BASE}/api/creator/upload`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: formValues.title,
                            src: formValues.fileUrl,
                            format: formValues.format,
                            isAd: formValues.isAd,
                            email: window.currentUser ? window.currentUser.email : 'Unknown'
                        })
                    })"""

text = text.replace(target, replace)

target2 = """fetch(`${API_BASE}/api/creator/upload`"""
# Find where it checks res.ok
# I will use a regex to replace the response handling
text = re.sub(
    r"""const res = await fetch\(`\$\{API_BASE\}/api/creator/upload`[\s\S]*?if \(!res\.ok\) throw new Error\('API Error'\);""",
    r"""const res = await fetch(`${API_BASE}/api/creator/upload`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: formValues.title,
                            src: formValues.fileUrl,
                            format: formValues.format,
                            isAd: formValues.isAd,
                            email: window.currentUser ? window.currentUser.email : 'Unknown'
                        })
                    });
                    
                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || 'API Error');
                    }""",
    text
)

with codecs.open('creator_portal.html', 'w', 'utf-8') as f:
    f.write(text)

print("Patched creator_portal.html")
