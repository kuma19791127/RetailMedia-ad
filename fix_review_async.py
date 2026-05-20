import codecs
with codecs.open('review.html', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace("function loadKYCReq() {", "async function loadKYCReq() {")
text = text.replace("// await cannot be at top level here, need to wrap in IIFE or fix logic", "const res = await fetch('/api/kyc');")

with codecs.open('review.html', 'w', 'utf-8') as f:
    f.write(text)

print("Fixed review.html async function")
