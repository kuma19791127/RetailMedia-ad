import codecs
import re

with codecs.open('agency_portal.html', 'r', 'utf-8') as f:
    text = f.read()

bank_fields = re.findall(r'<input[^>]*id=["\']?(bank[^"\']*)["\']?[^>]*>', text, re.IGNORECASE)
print("Agency Bank Fields:", bank_fields)

# Check if business type or invoice number exists
print("Business type exists:", 'business-type' in text)
print("Invoice number exists:", 'invoice-number' in text)
