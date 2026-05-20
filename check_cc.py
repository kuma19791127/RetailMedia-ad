import codecs
import re

with codecs.open('ad_dashboard.html', 'r', 'utf-8') as f:
    text = f.read()

# Check for square SDK
if 'square.js' in text or 'web.squarecdn.com' in text:
    print("Found Square SDK!")

# Check for raw credit card fields
card_fields = re.findall(r'<input[^>]*id=["\']?cc-[^>]*>', text, re.IGNORECASE)
for cf in card_fields:
    print("Found CC input:", cf)

# Find the payment logic
idx = text.find("function handlePayment")
if idx != -1:
    print(text[idx:text.find('}', idx+100)])
