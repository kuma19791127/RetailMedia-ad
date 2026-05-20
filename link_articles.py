import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

# Add link to articles_index.html in the footer
# Looking for footer section in index.html
footer_target = """<ul style="list-style:none; padding:0; line-height:1.8; font-size:0.95rem;">
                        <li><a href="company.html" style="color:#d1d5db; text-decoration:none;">運営会社</a></li>
                        <li><a href="privacy_policy.html" style="color:#d1d5db; text-decoration:none;">プライバシーポリシー</a></li>
                        <li><a href="terms.html" style="color:#d1d5db; text-decoration:none;">利用規約</a></li>
                    </ul>"""

footer_new = """<ul style="list-style:none; padding:0; line-height:1.8; font-size:0.95rem;">
                        <li><a href="company.html" style="color:#d1d5db; text-decoration:none;">運営会社</a></li>
                        <li><a href="articles_index.html" style="color:#d1d5db; text-decoration:none;">お役立ちコラム（知識ベース）</a></li>
                        <li><a href="privacy_policy.html" style="color:#d1d5db; text-decoration:none;">プライバシーポリシー</a></li>
                        <li><a href="terms.html" style="color:#d1d5db; text-decoration:none;">利用規約</a></li>
                    </ul>"""

if footer_target in text:
    text = text.replace(footer_target, footer_new)
else:
    # Let's just find the privacy policy link and inject it
    text = text.replace('<li><a href="privacy_policy.html"', '<li><a href="articles_index.html" style="color:#d1d5db; text-decoration:none;">お役立ちコラム</a></li>\n                        <li><a href="privacy_policy.html"')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(text)

print("Linked articles in index")
