import codecs
import re
with codecs.open('review.html', 'r', 'utf-8') as f:
    text = f.read()
scripts = re.findall(r'<script[^>]*>(.*?)</script>', text, re.DOTALL | re.IGNORECASE)
with codecs.open('review_script.js', 'w', 'utf-8') as f:
    f.write(scripts[2])
